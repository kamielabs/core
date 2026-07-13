import {
	Context,
	ToolsActionContext,
	ToolsGlobalsContext,
	ToolsStageContext
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
 * ToolsService
 *
 * Controlled exposure service for runtime tools available in hooks.
 *
 * Responsibilities:
 * - Provide a restricted set of utilities to hook contexts
 * - Scope available tools depending on lifecycle phase
 * - Delegate event emission to EventsManager
 *
 * Scope:
 * - signal emission (all contexts)
 * - message emission (globals/module/action contexts)
 * - event listener registration (globals context only)
 * - future runtime utilities (e.g. setCwd)
 *
 * Context separation:
 * - stageContext:
 *   - signal only
 *   - limited capabilities (pre-runtime phase)
 *
 * - globalsContext:
 *   - signal + message
 *   - addListener (attach output listeners)
 *
 * - moduleContext:
 *   - signal + message
 *
 * - actionContext:
 *   - signal + message
 *
 * Design principles:
 * - Strict capability scoping per lifecycle phase
 * - No direct access to core internals
 * - Thin wrapper over EventsManager
 * - Safe extension surface for future features
 *
 * Notes:
 * - setCwd() is reserved for future implementation (runtime mutation tool)
 * - Additional tools may be injected later (plugin system)
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class ToolsService {

	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	private constructor() {
	}

	public static create(): ToolsService {
		return new ToolsService();
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	/**
	 * Tools available in stage hooks.
	 *
	 * Exposes:
	 * - signal emission
	 *
	 * Stage hooks intentionally do not receive message emission capabilities.
	 */
	public stageContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): ToolsStageContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return {
			signal: {
				trace: (key, options) => ctx.events.signalTrace(key, options),
				debug: (key, options) => ctx.events.signalDebug(key, options),
				info: (key, options) => ctx.events.signalInfo(key, options),
				warn: (key, options) => ctx.events.signalWarn(key, options),
				throw: (key, options) => ctx.events.signalThrow(key, options),
			},
			events: {
				get: (filter) => ctx.events.getFilteredEvents(filter),
			},
			paths: {
				resolve: (input, options) => ctx.helpers.core.resolvePath(input, options)
			}
		};
	}

	/**
	 * Tools available in globals hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 * - addListener (attach output listeners only)
	 *
	 * `addListener()` delegates to the runtime output layer and does not expose
	 * flow or system listener registration.
	 */
	public globalsContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): ToolsGlobalsContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return {
			signal: {
				trace: (key, options) => ctx.events.signalTrace(key, options),
				debug: (key, options) => ctx.events.signalDebug(key, options),
				info: (key, options) => ctx.events.signalInfo(key, options),
				warn: (key, options) => ctx.events.signalWarn(key, options),
				throw: (key, options) => ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => ctx.events.messageTrace(key, options),
				debug: (key, options) => ctx.events.messageDebug(key, options),
				info: (key, options) => ctx.events.messageInfo(key, options),
				warn: (key, options) => ctx.events.messageWarn(key, options),
				throw: (key, options) => ctx.events.messageThrow(key, options),
			},
			events: {
				get: (filter) => ctx.events.getFilteredEvents(filter),
				addListener: (handler) => ctx.events.setOutputListener(handler),
			},
			paths: {
				resolve: (input, options) => ctx.helpers.core.resolvePath(input, options)
			}
		};
	}

	/**
	 * Tools available in module hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 *
	 * This context intentionally mirrors the action-level event API,
	 * without output listener registration.
	 */
	public moduleContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): ToolsActionContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return {
			signal: {
				trace: (key, options) => ctx.events.signalTrace(key, options),
				debug: (key, options) => ctx.events.signalDebug(key, options),
				info: (key, options) => ctx.events.signalInfo(key, options),
				warn: (key, options) => ctx.events.signalWarn(key, options),
				throw: (key, options) => ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => ctx.events.messageTrace(key, options),
				debug: (key, options) => ctx.events.messageDebug(key, options),
				info: (key, options) => ctx.events.messageInfo(key, options),
				warn: (key, options) => ctx.events.messageWarn(key, options),
				throw: (key, options) => ctx.events.messageThrow(key, options),
			},
			events: {
				get: (filter) => ctx.events.getFilteredEvents(filter),
			},
			paths: {
				resolve: (input, options) => ctx.helpers.core.resolvePath(input, options)
			}
		};
	}

	/**
	 * Tools available in action hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 *
	 * This is the broadest stable hook tool surface currently exposed by the core.
	 */
	public actionContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): ToolsActionContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return {
			signal: {
				trace: (key, options) => ctx.events.signalTrace(key, options),
				debug: (key, options) => ctx.events.signalDebug(key, options),
				info: (key, options) => ctx.events.signalInfo(key, options),
				warn: (key, options) => ctx.events.signalWarn(key, options),
				throw: (key, options) => ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => ctx.events.messageTrace(key, options),
				debug: (key, options) => ctx.events.messageDebug(key, options),
				info: (key, options) => ctx.events.messageInfo(key, options),
				warn: (key, options) => ctx.events.messageWarn(key, options),
				throw: (key, options) => ctx.events.messageThrow(key, options),
			},
			events: {
				get: (filter) => ctx.events.getFilteredEvents(filter),
			},
			paths: {
				resolve: (input, options) => ctx.helpers.core.resolvePath(input, options)
			}
		};
	}


	/**
	 * Future extension point:
	 * - Additional tools (plugins, runtime mutation helpers, etc.)
	 */
}
