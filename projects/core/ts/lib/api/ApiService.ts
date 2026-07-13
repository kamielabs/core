import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape,
} from "@types";

import {
	AfterActionHookMethod,
	BeforeActionHookMethod,
	Context,
	GlobalsHookMethod,
	ModulesActionHookMethod,
	ModulesHookMethod,
	StagesBuiltinHookMethod,
	StagesCustomHookMethod,
	StagesDefaultHookMethod
} from "@contexts";

/**
 * ApiService
 *
 * Public-facing service exposing controlled hook registration methods.
 *
 * Responsibilities:
 * - Provide a restricted API surface to the developer
 * - Delegate hook registration to underlying managers
 * - Prevent direct access to internal managers and runtime internals
 *
 * Scope:
 * - Stage hooks (builtin + custom)
 * - Stage default overrides
 * - Globals hook
 * - Module hooks
 * - Module action hooks
 *
	 * Architectural role:
	 * - Acts as a bridge between CLI.ts (userland entrypoint) and internal managers
	 * - Ensures only safe and intended extension points are exposed
	 * - Centralizes hook registration behind a single developer-facing service
 *
 * Design principles:
 * - No business logic
 * - No state mutation beyond delegation
 * - Thin wrapper over Context managers
 * - Stable public API surface for developers
 *
	 * Usage:
	 * - Exposed via CLI interface
	 * - Used by developers to register hooks after CLI initialization and before CLI running
	 * - Not intended to expose managers, runtime state or low-level internals directly
 *
 * Notes:
 * - Method names are part of public API → should remain stable
 * - Future extension point: plugin system (onPlugin)
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class ApiService<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape

> {

	private _ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	private constructor(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._ctx = ctx;
	}

	public static create<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): ApiService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new ApiService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>(ctx);
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	// -----------------------------------------------------
	// STAGE API
	// -----------------------------------------------------

	/**
	 * Override builtin default stage values.
	 *
	 * Delegates to StagesManager.overrideDefaultStage.
	 *
	 * @param defaults - Default stage overrides
	 */
	public setBuiltinStageDefaults: StagesDefaultHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (defaults) => {
		return this._ctx.stages.overrideDefaultStage(defaults);
	};

	/**
	 * Register a hook for a builtin stage.
	 *
	 * Delegates to StagesManager.registerBuiltinStageHook.
	 *
	 * @param stage - Builtin stage key
	 * @param hook - Hook function
	 */
	public onBuiltinStage: StagesBuiltinHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (stage, hook) => {
		return this._ctx.stages.registerBuiltinStageHook(stage, hook);
	}

	/**
	 * Register a hook for a custom stage.
	 *
	 * Delegates to StagesManager.registerCustomStageHook.
	 *
	 * @param stage - Custom stage key
	 * @param hook - Hook function
	 */
	public onCustomStage: StagesCustomHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (stage, hook) => {
		return this._ctx.stages.registerCustomStageHook(stage, hook);
	}

	// -----------------------------------------------------
	// GLOBALS API
	// -----------------------------------------------------

	/**
	 * Register a global hook.
	 *
	 * Delegates to GlobalsManager.customHook.
	 *
	 * @param hook - Globals hook
	 */
	public onGlobals: GlobalsHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (hook) => {
		return this._ctx.globals.customHook(hook);
	}

	// -----------------------------------------------------
	// MODULE API
	// -----------------------------------------------------

	/**
	 * Register a module hook.
	 *
	 * Delegates to ModulesManager.registerCustomModuleHook.
	 *
	 * @param module - Module key
	 * @param hook - Module hook
	 */
	public onModule: ModulesHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (module, hook) => {
		return this._ctx.modules.registerCustomModuleHook(module, hook);
	};


	public onBeforeAction: BeforeActionHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (hook) => {
		return this._ctx.modules.registerBeforeActionHook(hook)
	};


	public onAfterAction: AfterActionHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (hook) => {
		return this._ctx.modules.registerAfterActionHook(hook)
	};
	/**
	 * Register an action hook for a module.
	 *
	 * Delegates to ModulesManager.registerCustomActionHook.
	 *
	 * @param module - Module key
	 * @param action - Action key
	 * @param hook - Action hook
	 */
	public onModuleAction: ModulesActionHookMethod<
		TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp
	> = (module, action, hook) => {
		return this._ctx.modules.registerCustomActionHook(module, action, hook);
	};

	// -----------------------------------------------------
	// FUTURE
	// -----------------------------------------------------


	/**
	 * Future extension point for plugin system.
	 *
	 * Example:
	 * - onPlugin()
	 */
}
