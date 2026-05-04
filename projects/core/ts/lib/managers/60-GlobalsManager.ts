import { Context, GlobalsHook } from "@contexts";
import { FinalGlobals } from "@data";
import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsDecl,
	CoreGlobalsShape,
	CoreModulesShape,
	RuntimeGlobalsFacts,
	CoreTranslationsShape,
	ExtractGlobals,
	RuntimeStageFacts
} from "@types";


/**
 * GlobalsManager
 *
 * Runtime resolver responsible for global CLI options.
 *
 * Responsibilities:
 * - Index global options (ENV + CLI flags)
 * - Validate ENV uniqueness across stages and globals
 * - Parse CLI global flags
 * - Resolve final global values using multi-source precedence
 * - Execute optional developer hook
 * - Produce immutable RuntimeGlobalsFacts
 *
 * Position in lifecycle:
 * - Executes AFTER stages resolution
 * - Executes BEFORE modules/actions resolution
 * - Represents the final step before runtime is considered "ready"
 *
 * Core concept:
 * - Globals act as the bridge between pre-runtime (stages/env)
 *   and runtime execution (modules/actions)
 * - Each option belongs to a parent group key used as the final runtime namespace
 *
 * Resolution model:
 * - Each global option is backed by an ENV variable (single source of truth)
 * - One ENV variable may expose zero to many associated CLI flags
 * - CLI flags (if defined) override ENV values
 * - Final value is always stored in the runtime globals dictionary
 *
 * Precedence order:
 * DEFAULT < ENV_FILE < ENV_VAR < CLI_FLAG
 *
 * CLI behavior:
 * - Flags may accept a value → that value is used directly
 * - Flags may be value-less → a predefined value is injected
 * - Multiple flags may map to the same global option
 * - Builtin globals enable `help` and `version` overrides even in runtimes
 *   that do not expose standard module selection
 *
 * Design principles:
 * - Deterministic resolution (single pass)
 * - ENV variables are the canonical runtime storage
 * - CLI is only an override layer
 * - No mutation after resolution (freeze enforced)
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class GlobalsManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	private _dict: CoreGlobalsDecl<TGlobals>;
	private _draft?: RuntimeGlobalsFacts | undefined;
	private _resolved?: RuntimeGlobalsFacts;

	/**
	 * Optional developer-defined hook executed after globals resolution.
	 *
	 * Provides:
	 * - resolved options
	 * - runtime context
	 * - tools access
	 * - snapshot access
	 */
	private _customGlobalsHook: GlobalsHook<TEvents, TStages, TGlobals, TModules, TTranslations> | undefined = undefined;

	/**
	 * Constructor.
	 *
	 * Initializes globals dictionary and builds:
	 * - ENV index
	 * - CLI flag index
	 *
	 * @param ctx - Global execution context
	 * @param GlobalsDict - Final globals declaration
	 */
	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		GlobalsDict: FinalGlobals<TGlobals>
	) {
		this._ctx = ctx;
		this._dict = {
			options: GlobalsDict,
			flagIndex: { byKey: {} },
			envIndex: { byEnv: {} }
		} satisfies CoreGlobalsDecl<TGlobals>
		// this._resolveIndexes();
		// this._freezeDict();
	}

	public init: () => Promise<void> = async (): Promise<void> => {
		this._resolveIndexes();
		this._freezeDict();
	};

	/**
	 * Freeze the declaration dictionary once all lookup indexes are prepared.
	 */
	private _freezeDict() {
		this._dict = this._ctx.helpers.core.deepFreeze(this._dict);
	}

	/**
	 * Store the mutable globals draft before the final runtime snapshot is frozen.
	 */
	private _setDraft(state: RuntimeGlobalsFacts) {
		this._draft = state;
	}

	/**
	 * Clear the mutable globals draft once resolution is finalized.
	 */
	private _clearDraft() {
		this._draft = undefined;
	}

	/**
	 * Freeze and persist the final immutable runtime globals facts.
	 */
	private _setResolved(state: RuntimeGlobalsFacts): void | never {
		if (this._resolved) {
			this._ctx.events.throw('globalsAlreadyResolved');
		}
		this._resolved = this._ctx.helpers.core.deepClone(state);
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	public getDict(): Readonly<CoreGlobalsDecl<TGlobals>> {
		const dict = this._ctx.helpers.core.deepClone(this._dict);
		this._ctx.helpers.core.deepFreeze(dict)
		return dict;
	}

	/**
	 * Return the current mutable globals draft.
	 *
	 * This state only exists during resolution, before final freezing.
	 */
	public getDraft(): RuntimeGlobalsFacts {
		if (!this._draft) {
			this._ctx.events.throw('globalsMissingDraft');
		}
		return this._draft;
	}

	/**
	 * Return the final immutable runtime globals facts.
	 */
	public getResolved(): RuntimeGlobalsFacts {
		if (!this._resolved) {
			this._ctx.events.throw('globalsMissingResolved');
		}
		return this._resolved;
	}


	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
	}
	/**
	 * Resolve lifecycle.
	 *
	 * Steps:
	 * 1. Validate ENV collisions with stage definitions
	 * 2. Load ENV sources (bootstrap + stage file)
	 * 3. Determine parser next phase (args or module)
	 * 4. Parse CLI global flags
	 * 5. Resolve final global values
	 * 6. Emit globalsHooking event
	 * 7. Execute custom hook (if defined)
	 * 8. Freeze and finalize runtime globals
	 *
	 * The parser phase selected here depends on module capabilities:
	 * `__defaultModule__` runtimes continue directly to `args`, while standard
	 * runtimes continue to `module`.
	 *
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		const bootstrap = this._ctx.bootstrap.getResolved();

		const stage = this._ctx.stages.getResolved();

		this._validateGlobalsVsStageEnv(stage);

		const fileEnv = this._ctx.helpers.core.loadEnvFile(stage.file);

		const envVars = bootstrap.envs;
		const hasDefaultModule =
			Object.prototype.hasOwnProperty.call(this._ctx.modules.getDict().modules, "__defaultModule__");

		const nextPhase = hasDefaultModule ? "args" : "module";

		// Parse CLI globals
		this._ctx.parser.resolveGlobals(this._dict.flagIndex, nextPhase);

		const resolved = this._resolveGlobalsValues(envVars, fileEnv);
		this._setDraft(resolved);

		await this._ctx.events.emit("globalsHooking");

		if (this._customGlobalsHook) {
			this._customGlobalsHook({
				options: this._draft as ExtractGlobals<TGlobals>,
				runtime: this._ctx.runtime.globalsContext(),
				tools: this._ctx.tools.globalsContext(),
				snapshot: this._ctx.snapshot.snapshotContext()
			})
		}

		this._setResolved(resolved);
		this._clearDraft();
	}

	/**
	 * Build indexes for global options.
	 *
	 * Creates:
	 * - envIndex.byEnv → ENV variable → (group, option)
	 * - flagIndex.byKey → CLI flag → (group, option, metadata)
	 *
	 * Validation rules:
	 * - ENV variables must be unique across all globals
	 * - CLI flags (long, short, aliases) must be unique
	 *
	 * Supports:
	 * - long flags (--flag)
	 * - short flags (-f)
	 * - aliases (short or long)
	 *
	 * Group names are preserved in both indexes because they define the parent
	 * bucket later used by parser storage and runtime globals facts.
	 *
	 */
	private _resolveIndexes() {

		const decl = this._dict;

		for (const groupName in decl.options) {

			const group = decl.options[groupName];

			for (const optionName in group) {

				const opt = group[optionName];
				if (!opt) continue;

				// ENV index
				if (decl.envIndex.byEnv[opt.env]) {
					this._ctx.events.throw('globalsDuplicateEnv', {
						details: [
							`${opt.env}`
						]
					})
				}
				decl.envIndex.byEnv[opt.env] = {
					env: opt.env,
					groupName,
					optionName
				};

				if (!opt.cli) continue;

				for (const flag of opt.cli) {
					const longRawkey = `--${flag.long}`;
					if (decl.flagIndex.byKey[longRawkey]) {
						this._ctx.events.throw('globalsDuplicateFlag', {
							details: [
								`${longRawkey}`
							]
						});
					}
					decl.flagIndex.byKey[longRawkey] = {
						key: flag.long,
						raw: longRawkey,
						kind: 'long',
						groupName,
						optionName,
						cliOption: flag
					};

					if (flag.short) {
						const shortRawkey = `-${flag.short}`;
						if (decl.flagIndex.byKey[shortRawkey]) {
							this._ctx.events.throw('globalsDuplicateFlag', {
								details: [
									`${flag.short}`
								]
							});
						}
						decl.flagIndex.byKey[shortRawkey] = {
							key: flag.short,
							raw: shortRawkey,
							kind: 'short',
							groupName,
							optionName,
							cliOption: flag
						};
					}

					if (flag.aliases) {
						for (const alias of flag.aliases) {
							if (alias.length === 1) {
								const shortAliasRawKey = `-${alias}`;
								if (decl.flagIndex.byKey[alias]) {
									this._ctx.events.throw('globalsDuplicateFlag', {
										details: [
											`${shortAliasRawKey}`
										]
									});
								}
								decl.flagIndex.byKey[shortAliasRawKey] = {
									key: alias,
									raw: shortAliasRawKey,
									kind: 'short',
									groupName,
									optionName,
									cliOption: flag
								};
							} else {
								const longAliasRawKey = `--${alias}`
								if (decl.flagIndex.byKey[alias]) {
									this._ctx.events.throw('globalsDuplicateFlag', {
										details: [
											`${longAliasRawKey}`
										]
									});
								}
								decl.flagIndex.byKey[longAliasRawKey] = {
									key: alias,
									raw: longAliasRawKey,
									kind: 'long',
									groupName,
									optionName,
									cliOption: flag
								};
							}
						}
					}

				}
			}
		}
	}

	/**
	 * Resolve all global values.
	 *
	 * Resolution order per option:
	 * 1. Default value
	 * 2. ENV file override
	 * 3. ENV variable override
	 * 4. CLI override (highest priority)
	 *
	 * Important:
	 * - CLI values are already parsed and normalized by ParserManager
	 * - Final values are stored grouped by global group
	 * - ENV remains the canonical declaration source even when CLI flags are exposed
	 *
	 * @param envVars - Environment variables from bootstrap
	 * @param fileEnv - Parsed ENV file values
	 * @returns RuntimeGlobalsFacts
	 */
	private _resolveGlobalsValues(
		envVars: Record<string, string | undefined>,
		fileEnv: Record<string, string>
	): RuntimeGlobalsFacts | never {

		const decl = this._dict;
		const resolved: RuntimeGlobalsFacts = {};
		const parserContext = this._ctx.parser.getContext();

		const cliGlobals = parserContext.globals ?? {};

		for (const groupName in decl.options) {

			const group = decl.options[groupName];

			for (const optionName in group) {

				const opt = group[optionName];
				if (!opt) continue;

				const envKey = opt.env;
				const defaultValue = opt.default;

				resolved[groupName] ??= {};
				resolved[groupName][optionName] = defaultValue;

				// ENV FILE override
				if (envKey && fileEnv[envKey] !== undefined) {
					resolved[groupName][optionName] = this._ctx.helpers.core.castEnvValue(fileEnv[envKey], defaultValue);
				}

				// ENV VAR override
				if (envKey && envVars[envKey] !== undefined) {
					resolved[groupName][optionName] = this._ctx.helpers.core.castEnvValue(envVars[envKey] as string, defaultValue);
				}

				// CLI override
				const cliValue = cliGlobals[groupName]?.[optionName];
				if (cliValue !== undefined) {
					resolved[groupName][optionName] = cliValue;
				}

			}

		}

		return resolved;
	}

	/**
	 * Validate globals ENV declarations against stage ENV declarations.
	 *
	 * Rule:
	 * - A global ENV key must NOT collide with a stage ENV key
	 *
	 * This prevents:
	 * - ambiguous resolution sources
	 * - undefined override behavior
	 *
	 */
	private _validateGlobalsVsStageEnv(stage: RuntimeStageFacts): void | never {
		const runtimeStage = stage.name;
		const globalsEnvIndex = this._dict.envIndex.byEnv;
		const stageEnvIndex = this._ctx.stages.getDict().envIndex.byStage[runtimeStage];
		const stageEnv = stageEnvIndex?.byEnv ?? {};

		for (const env in globalsEnvIndex) {

			if (stageEnv[env]) {
				this._ctx.events.throw('globalsConflictEnv', {
					details: [`${env}`, `stage: ${runtimeStage}`]
				})
			}

		}
	}

	/**
	 * Register a custom globals hook.
	 *
	 * Notes:
	 * - Builtin globals remain declaration-owned by the core
	 * - Hook operates after values are resolved and before final freezing
	 * - Hook is runtime-facing only, not a declaration mutation point
	 *
	 * @param hook - GlobalsHook implementation
	 */
	public customHook(hook: GlobalsHook<TEvents, TStages, TGlobals, TModules, TTranslations, ExtractGlobals<TGlobals>>) {
		this._customGlobalsHook = hook;
	}
}
