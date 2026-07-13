import {
	Context,
	RuntimeFullContext,
	RuntimeGlobalsContext,
	RuntimeModuleContext,
	RuntimeStageContext
} from "@contexts";
import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape,
} from "@types";

/**
 * RuntimeService
 *
 * Central orchestrator of the core execution lifecycle.
 *
 * Responsibilities:
 * - Control and enforce runtime state transitions
 * - Orchestrate resolution order of all managers
 * - Build the global runtime facts progressively (draft → resolved)
 * - Emit lifecycle events at each step
 * - Expose contextual runtime views for hooks
 *
 * Core role:
 * - Single source of truth for runtime progression
 * - Guarantees deterministic execution flow
 * - Prevents invalid lifecycle transitions
 *
 * Lifecycle phases (ordered):
 * - init → bootstrap → stage → i18n → globals → module → ready
 *
 * Each phase:
 * - Resolves a specific manager
 * - Updates runtime draft
 * - Emits lifecycle events
 * - Advances internal state machine
 *
	 * State machine:
	 * - Enforced via _runtimeState and _runtimeTransitions
	 * - Any invalid transition emits a terminal runtime event
	 * - Ensures strict execution order
 *
 * Draft model:
 * - _draft is progressively filled during lifecycle
 * - Each phase injects its resolved facts
 * - Final runtime is frozen at "ready"
 *
 * Context exposure:
 * - stageContext(): partial runtime (bootstrap + stage draft)
 * - globalsContext(): adds globals draft
 * - moduleContext(): adds module draft
 * - actionContext(): full resolved runtime
 *
 * Design principles:
 * - Deterministic lifecycle orchestration
 * - Strict state enforcement
 * - Progressive runtime construction
 * - No mutation after ready state
 *
 * Notes:
 * - This service does NOT contain business logic
 * - It only orchestrates managers and enforces invariants
 * - All side effects are delegated to managers and events
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class RuntimeService {

	/**
	 * Constructor.
	 *
	 * Initializes runtime in "init" state.
	 *
	 * @param ctx - Global execution context
	 */
	private constructor() { };

	public static create(): RuntimeService {
		return new RuntimeService();
	}

	public init: () => Promise<void> = async (): Promise<void> => { };


	/**
	 * Stage-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (draft from StagesManager)
	 *
	 * This is the earliest runtime view exposed to hooks.
	 */
	public stageContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>): RuntimeStageContext<TApp> {
		return {
			bootstrap: ctx.bootstrap.getResolved(),
			stage: ctx.stages.getDraft(),
			app: ctx.runtime.getApp()
		}
	}

	/**
	 * Globals-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (draft from GlobalsManager)
	 */
	public globalsContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>): RuntimeGlobalsContext<TApp> {
		return {
			bootstrap: ctx.bootstrap.getResolved(),
			stage: ctx.stages.getResolved(),
			globals: ctx.globals.getDraft(),
			app: ctx.runtime.getApp()
		}
	}

	/**
	 * Module-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (resolved)
	 * - module (draft from ModulesManager)
	 */
	public moduleContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>): RuntimeModuleContext<TApp> {

		return {
			bootstrap: ctx.bootstrap.getResolved(),
			stage: ctx.stages.getResolved(),
			globals: ctx.globals.getResolved(),
			module: ctx.modules.getDraft(),
			app: ctx.runtime.getApp()
		}
	}

	/**
	 * Full runtime context (final).
	 *
	 * Only available after ready state.
	 */
	public actionContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>): RuntimeFullContext<TApp> {
		return { ...ctx.runtime.getResolved(), app: ctx.runtime.getApp() }
	}
}
