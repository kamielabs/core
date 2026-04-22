import { ResolverManagerWithDict } from "@abstracts";

import {
	Context,
	ActionHook,
	RuntimeActionHook,
	ModuleHook
} from "@contexts";

import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreModulesShapeDecl,
	CoreStagesShape,
	RuntimeModuleFacts,
	ModuleInfos,
	CLIFlag,
	CoreTranslationsShape,
	BuiltinActions,
	CustomActions,
	BuiltinActionFlags,
	CustomActionFlags,
	BuiltinModuleKey,
	CustomModuleKey,
	BuiltinModuleFlags,
	CustomModuleFlags,
	ParsedOptionValue,
	SingleAction,
	DefaultAction,
	ModuleAction,
	BuiltinModuleWithOptionsKey,
	CustomModuleWithOptionsKey,
	RuntimeGlobalsFacts
} from "@types";

import { BUILTIN_MODULES, FinalModules } from "@data";

import {
	CoreError,
	ModulesHelpers
} from "@helpers";

import { helpShow, versionShow } from "@data/modules";

/**
 * TODO: V0.1: Setup runner() real behavior with ignoring parserIssues and sending to help
 *
 * TODO: V0.1: write a real usable help module which should show at least a good usage, and details for module/action
 *
 * TODO: V0.1: Polish the entire class
 *
 * TODO: V0.1: Review the full class and deps for validating v0.1
 */

/**
 * ModulesManager
 *
 * Central runtime resolver for modules and actions.
 *
 * Responsibilities:
 * - Build module/action indexes (names, aliases, flags)
 * - Validate module structure (actions vs defaultAction vs singleAction)
 * - Resolve runtime module/action from parsed CLI context
 * - Handle builtin overrides (help/version)
 * - Execute module-level hooks (pre-action)
 * - Provide action runner execution entrypoint
 *
 * Position in lifecycle:
 * - Executes AFTER globals resolution
 * - Consumes ParserManager output
 * - Produces RuntimeModuleFacts
 * - Delegates final execution to action hooks (userland)
 *
 * Core concepts:
 * - Modules define execution domains
 * - Actions define executable units
 * - Flags are scoped (module vs action)
 * - Runtime resolution is deterministic and immutable after freeze
 *
 * Execution model:
 * - Resolve runtime → determine module/action
 * - Execute optional module hook
 * - Runner executes action hook
 * - Core stops here → userland takes control
 *
 * Special behaviors:
 * - Builtin override via globals (help/version)
 * - Single module mode (__defaultModule__)
 * - Fallback to help on parser issues
 *
 * Design principles:
 * - Strict separation between resolution and execution
 * - No runtime mutation after freeze
 * - Hooks provide extension points without breaking invariants
 * - Core remains minimal, userland owns business logic
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class ModulesManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends ResolverManagerWithDict<
	CoreModulesShapeDecl<TModules>,
	RuntimeModuleFacts,
	TEvents,
	TStages,
	TGlobals,
	TModules,
	TTranslations
> {

	/**
	 * Builtin module hooks registry.
	 */
	private _builtinModuleHooks: {
		[M in BuiltinModuleWithOptionsKey<TModules>]?: ModuleHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			BuiltinModuleFlags<TModules, M>
		>
	} = {};

	/**
	 * Custom module hooks registry.
	 */
	private _customModuleHooks: {
		[M in CustomModuleWithOptionsKey<TModules>]?: ModuleHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			CustomModuleFlags<TModules, M>
		>
	} = {};

	/**
	 * Builtin action hooks registry.
	 */
	private _builtinActionHooks: {
		[M in BuiltinModuleKey<TModules>]?: {
			[A in keyof BuiltinActions<TModules, M>]?: ActionHook<
				TEvents, TStages, TGlobals, TModules, TTranslations,
				BuiltinActionFlags<TModules, M, A>
			>
		}
	} = {};

	/**
	 * Custom action hooks registry.
	 */
	private _customActionHooks: {
		[M in CustomModuleKey<TModules>]?: {
			[A in keyof CustomActions<TModules, M>]?: ActionHook<
				TEvents, TStages, TGlobals, TModules, TTranslations,
				CustomActionFlags<TModules, M, A>
			>
		}
	} = {};

	/**
	 * Constructor.
	 *
	 * Initializes module dictionary and builds:
	 * - module index (name + alias)
	 * - action index (per module)
	 * - flag index (module + action)
	 *
	 * Also registers builtin actions (help/version).
	 *
	 * @param ctx - Global execution context
	 * @param modulesDict - Final modules declaration
	 */
	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		modulesDict: FinalModules<TModules>
	) {

		super(
			ctx,
			{
				modules: modulesDict,
				moduleIndex: { byName: {}, byAlias: {} },
				actionIndex: { byModule: {} },
				flagIndex: { module: {}, action: {} }
			} satisfies CoreModulesShapeDecl<TModules>
		);

		this._resolveIndexes();

		// Register builtin actions
		this._registerBuiltinActionHook('help', 'show', helpShow());
		this._registerBuiltinActionHook('version', 'show', versionShow());
	}

	// -----------------------------------------------------
	// INDEX BUILDING
	// -----------------------------------------------------

	/**
	 * Get module entries as typed tuples.
	 */
	private _getModuleEntries(): Array<[string, ModuleInfos]> {
		return Object.entries(this._dict.modules) as Array<[string, ModuleInfos]>;
	}

	/**
	 * Build all module-related indexes.
	 *
	 * Includes:
	 * - module name/alias resolution
	 * - action indexes
	 * - flag indexes
	 *
	 * Validation:
	 * - "__defaultModule__" cannot coexist with other modules
	 *
	 * @throws CoreError on invalid module configuration
	 */
	private _resolveIndexes(): void {
		const modules = this._getModuleEntries();

		const customModules = modules.filter(([name]) => !(name in BUILTIN_MODULES));

		const hasDefaultModule = customModules.some(([name]) => name === "__defaultModule__");

		if (hasDefaultModule && customModules.length > 1) {
			throw new CoreError(
				'SINGLE_VS_MODULES_CONFLICT',
				'ModulesManager',
				`Invalid modules declaration: "__defaultModule__" cannot coexist with named modules`
			);
		}

		for (const [moduleName, module] of modules) {
			if (!module) continue;

			this._dict.moduleIndex.byName[moduleName] = module;

			if (module.aliases) {
				for (const alias of module.aliases) {
					this._dict.moduleIndex.byAlias[alias] = moduleName;
				}
			}

			this._resolveActionIndexes(moduleName, module);
			this._resolveModuleFlags(moduleName, module);
		}
	}

	/**
	 * Extract action entries from module.
	 *
	 * Supports:
	 * - actions
	 * - defaultAction
	 * - singleAction
	 */
	private _getActionEntries(
		module: ModuleInfos
	): Array<[string, ModuleAction | DefaultAction | SingleAction]> {

		if ("actions" in module && module.actions) {
			return Object.entries(module.actions);
		}

		if ("defaultAction" in module && module.defaultAction) {
			return [["__defaultAction__", module.defaultAction.__defaultAction__]];
		}

		if ("singleAction" in module && module.singleAction) {
			return [["__singleAction__", module.singleAction.__singleAction__]];
		}

		return [];
	}

	/**
	 * Validate that module defines only one action container.
	 *
	 * @throws CoreError if multiple containers are defined
	 */
	private _validateActionContainer(moduleName: string, module: ModuleInfos): void {
		const hasActions = "actions" in module && !!module.actions;
		const hasDefaultAction = "defaultAction" in module && !!module.defaultAction;
		const hasSingleAction = "singleAction" in module && !!module.singleAction;

		const count =
			Number(hasActions) +
			Number(hasDefaultAction) +
			Number(hasSingleAction);

		if (count > 1) {
			throw new CoreError(
				'ACTIONS_VS_DEFAULT_VS_SINGLE_CONFLICT',
				'ModulesManager',
				`Invalid module "${moduleName}": only one of "actions", "defaultAction" or "singleAction" can be defined`
			);
		}
	}

	// -----------------------------------------------------
	// ACTION INDEX
	// -----------------------------------------------------

	/**
	 * Build action indexes for a module.
	 *
	 * Includes:
	 * - action name resolution
	 * - alias resolution
	 * - action flags indexing
	 */
	private _resolveActionIndexes(
		moduleName: string,
		module: ModuleInfos
	) {

		this._validateActionContainer(moduleName, module);

		this._dict.actionIndex.byModule[moduleName] = {
			byName: {},
			byAlias: {}
		};

		const container =
			"actions" in module
				? module.actions
				: "defaultAction" in module
					? module.defaultAction
					: module.singleAction;

		if (!container) return;

		for (const [actionName, action] of this._getActionEntries(module)) {
			if (!action) continue;

			const nameIndex = this._dict.actionIndex.byModule[moduleName].byName;
			nameIndex[actionName] = action;

			if (action.aliases) {
				for (const alias of action.aliases) {
					this._dict.actionIndex.byModule[moduleName].byAlias[alias] = actionName;
				}
			}

			this._resolveActionFlags(moduleName, actionName, action.options);
		}
	}

	// -----------------------------------------------------
	// MODULE FLAGS
	// -----------------------------------------------------

	/**
	 * Build module-level flags index.
	 *
	 * Only applies to modules with explicit "actions" container.
	 */
	private _resolveModuleFlags(
		moduleName: string,
		module: ModuleInfos
	) {

		if ("actions" in module) {

			if (!module.options) return;

			this._dict.flagIndex.module ??= {};
			this._dict.flagIndex.module[moduleName] ??= { byKey: {} };

			const index = this._dict.flagIndex.module[moduleName].byKey;

			for (const optionName in module.options) {

				const option = module.options[optionName];
				if (!option) continue;

				index[`--${option.long}`] = {
					scope: "module",
					module: moduleName,
					optionName
				};

				if (option.short) {
					index[`-${option.short}`] = {
						scope: "module",
						module: moduleName,
						optionName
					};
				}
			}
		}
	}

	// -----------------------------------------------------
	// ACTION FLAGS
	// -----------------------------------------------------

	/**
	 * Build action-level flags index.
	 */
	private _resolveActionFlags(
		moduleName: string,
		actionName: string,
		options?: Record<string, CLIFlag>
	) {

		if (!options) return;

		this._dict.flagIndex.action ??= {};
		this._dict.flagIndex.action[moduleName] ??= {};
		this._dict.flagIndex.action[moduleName][actionName] ??= { byKey: {} };

		for (const optionName in options) {
			const option = options[optionName];
			if (!option) continue;

			const index = this._dict.flagIndex.action[moduleName][actionName].byKey;

			index[`--${option.long}`] = {
				scope: "action",
				module: moduleName,
				action: actionName,
				optionName
			};

			if (option.short) {
				index[`-${option.short}`] = {
					scope: "action",
					module: moduleName,
					action: actionName,
					optionName
				};
			}
		}
	}

	// -----------------------------------------------------
	// RESOLVE ENTRYPOINT
	// -----------------------------------------------------

	/**
	 * Resolve builtin override from globals.
	 *
	 * Supports:
	 * - help
	 * - version
	 */
	private _resolveBuiltinOverride(globals: RuntimeGlobalsFacts) {
		if (globals.core?.help) return "help";
		if (globals.core?.version) return "version";
		return null;
	}

	/**
	 * Detect single-module runtime mode.
	 */
	private _isSingleModuleRuntime(): boolean {
		return "__defaultModule__" in this._dict.modules;
	}

	/**
	 * Resolve runtime module/action facts.
	 *
	 * Steps:
	 * - Compute runtime (module + action + options)
	 * - Execute module hook (if any)
	 * - Freeze and finalize
	 */
	public async resolve(): Promise<void> {
		const runtime = this._resolveRuntime();
		this.setDraft(runtime);

		await this._executeModuleHook(runtime);

		this.freezeDict();
		this.setResolved(runtime);
	}

	// -----------------------------------------------------
	// RUNTIME RESOLUTION
	// -----------------------------------------------------

	/**
	 * Compute RuntimeModuleFacts.
	 *
	 * Handles:
	 * - builtin overrides (help/version)
	 * - single module mode
	 * - full module/action parsing
	 */
	private _resolveRuntime(): RuntimeModuleFacts {
		const parser = this.ctx.parser;
		const dict = this.getDict();

		const moduleFlags = this._dict.flagIndex.module;
		const actionFlags = this._dict.flagIndex.action;

		const overrideAction = this._resolveBuiltinOverride(this.ctx.globals.getResolved());

		if (overrideAction) {
			parser.finalizeArgsPhase();
			const parsed = parser.getContext();

			return overrideAction === "help"
				? {
					moduleName: "help",
					moduleOptions: {},
					actionName: 'show',
					actionOptions: {},
					args: parsed.args ?? []
				} : {
					moduleName: "version",
					moduleOptions: {},
					actionName: 'show',
					actionOptions: {},
					args: parsed.args ?? []
				}
		}

		if (this._isSingleModuleRuntime()) {
			parser.finalizeArgsPhase();

			const parsed = parser.getContext();

			return {
				moduleName: "__defaultModule__",
				moduleOptions: {},
				actionName: "__singleAction__",
				actionOptions: {},
				args: parsed.args ?? []
			};
		}

		parser.resolveModule(
			dict.moduleIndex,
			dict.actionIndex,
			ModulesHelpers.buildParserFlagIndexFromModule(dict.modules, moduleFlags),
			ModulesHelpers.buildParserFlagIndexFromAction(dict.modules, actionFlags)
		);

		const parsed = parser.getContext();

		return {
			moduleName: parsed.module ?? "",
			moduleOptions: parsed.moduleOptions ?? {},
			actionName: parsed.action ?? "",
			actionOptions: parsed.actionOptions ?? {},
			args: parsed.args ?? []
		};
	}

	// -----------------------------------------------------
	// RUNNER
	// -----------------------------------------------------

	/**
	 * Execute resolved action.
	 *
	 * Behavior:
	 * - If parser issues exist → fallback to help
	 * - Resolve corresponding action hook
	 * - Execute hook with runtime context
	 *
	 * This is the final step of the core.
	 * After this, execution is fully delegated to userland.
	 *
	 * @throws Error if no hook is found
	 */
	public async runner() {
		const issues = this.ctx.parser.getIssues();

		let moduleName: string;
		let actionName: string;
		let hook: ActionHook<TEvents, TStages, TGlobals, TModules, TTranslations> | undefined;

		if (issues.length > 0) {
			moduleName = "help";
			actionName = "show";
			hook = this.ctx.modules.getActionHook('help', 'show');
		} else {
			const resolved = this.ctx.modules.getResolved();
			moduleName = resolved.moduleName;
			actionName = resolved.actionName;
			hook = this.ctx.modules.getActionHook(moduleName, actionName);
		}

		if (!hook) {
			throw new Error(`Missing hook for ${moduleName}.${actionName}`);
		}

		await hook({
			options: this.ctx.modules.getResolved().actionOptions,
			runtime: this.ctx.runtime.actionContext(),
			tools: this.ctx.tools.actionContext(),
			snapshot: this.ctx.snapshot.snapshotContext(),
		});
	}

	// -----------------------------------------------------
	// MODULE HOOKS
	// -----------------------------------------------------

	/**
	 * Reserved for future builtin module hooks.
	 */
	private _registerBuiltinModuleHook<
		M extends BuiltinModuleWithOptionsKey<TModules>
	>(
		module: M,
		hook: ModuleHook<
			TEvents,
			TStages,
			TGlobals,
			TModules,
			TTranslations,
			BuiltinModuleFlags<TModules, M>
		>
	) {
		this._builtinModuleHooks[module] = hook;
	}

	/**
	 * Register custom module hook.
	 */
	public registerCustomModuleHook<
		M extends CustomModuleWithOptionsKey<TModules>
	>(
		module: M,
		hook: ModuleHook<
			TEvents,
			TStages,
			TGlobals,
			TModules,
			TTranslations,
			CustomModuleFlags<TModules, M>
		>
	) {
		this._customModuleHooks[module] = hook;
	}

	/**
	 * Retrieve module hook.
	 */
	public getModuleHook(
		module: string
	): ModuleHook<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	> | undefined {

		const builtin = this._builtinModuleHooks as Partial<
			Record<string, ModuleHook<
				TEvents, TStages, TGlobals, TModules, TTranslations,
				Record<string, ParsedOptionValue>
			>>
		>;

		const custom = this._customModuleHooks as Partial<
			Record<string, ModuleHook<
				TEvents, TStages, TGlobals, TModules, TTranslations,
				Record<string, ParsedOptionValue>
			>>
		>;

		return (
			builtin[module] ??
			custom[module]
		);
	}

	/**
	 * Execute module hook if defined.
	 */
	private async _executeModuleHook(runtime: RuntimeModuleFacts) {
		const hook = this.getModuleHook(runtime.moduleName);

		if (!hook) return;

		await hook({
			runtime: this.ctx.runtime.moduleContext(),
			tools: this.ctx.tools.moduleContext(),
			snapshot: this.ctx.snapshot.snapshotContext(),
			options: runtime.moduleOptions
		});
	}

	// -----------------------------------------------------
	// ACTION HOOKS
	// -----------------------------------------------------

	/**
	 * Register builtin action hook.
	 */
	private _registerBuiltinActionHook<
		M extends BuiltinModuleKey<TModules>,
		A extends keyof BuiltinActions<TModules, M>
	>(
		module: M,
		action: A,
		hook: ActionHook<
			TEvents,
			TStages,
			TGlobals,
			TModules,
			TTranslations,
			BuiltinActionFlags<TModules, M, A>
		>
	) {
		this._builtinActionHooks[module] ??= {};
		this._builtinActionHooks[module][action] = hook;
	}

	/**
	 * Register custom action hook.
	 */
	public registerCustomActionHook<
		M extends CustomModuleKey<TModules>,
		A extends keyof CustomActions<TModules, M>
	>(
		module: M,
		action: A,
		hook: ActionHook<
			TEvents,
			TStages,
			TGlobals,
			TModules,
			TTranslations,
			CustomActionFlags<TModules, M, A>
		>
	) {
		this._customActionHooks[module] ??= {};
		this._customActionHooks[module][action] = hook;
	}

	/**
	 * Retrieve action hook.
	 */
	public getActionHook(
		module: string,
		action: string
	): RuntimeActionHook<TEvents, TStages, TGlobals, TModules, TTranslations> | undefined {

		const builtin = this._builtinActionHooks as Partial<
			Record<string, Record<string, RuntimeActionHook<TEvents, TStages, TGlobals, TModules, TTranslations>>>
		>;

		const custom = this._customActionHooks as Partial<
			Record<string, Record<string, RuntimeActionHook<TEvents, TStages, TGlobals, TModules, TTranslations>>>
		>;

		return (
			builtin[module]?.[action] ??
			custom[module]?.[action]
		);
	}
}
