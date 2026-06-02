import {
	Context,
	ToolsActionContext,
	ToolsGlobalsContext,
	ToolsStageContext
} from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
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
export class ToolsService<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape

> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		this._ctx = ctx;
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	/**
	 * Tools available in stage hooks.
	 *
	 * Exposes:
	 * - signal emission
	 * - `setCwd` placeholder (currently a no-op)
	 *
	 * Stage hooks intentionally do not receive message emission capabilities.
	 */
	public stageContext(): ToolsStageContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: {
				trace: (key, options) => this._ctx.events.signalTrace(key, options),
				debug: (key, options) => this._ctx.events.signalDebug(key, options),
				info: (key, options) => this._ctx.events.signalInfo(key, options),
				warn: (key, options) => this._ctx.events.signalWarn(key, options),
				throw: (key, options) => this._ctx.events.signalThrow(key, options),
			},
			setCwd: () => { }
		}
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
	public globalsContext(): ToolsGlobalsContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: {
				trace: (key, options) => this._ctx.events.signalTrace(key, options),
				debug: (key, options) => this._ctx.events.signalDebug(key, options),
				info: (key, options) => this._ctx.events.signalInfo(key, options),
				warn: (key, options) => this._ctx.events.signalWarn(key, options),
				throw: (key, options) => this._ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => this._ctx.events.messageTrace(key, options),
				debug: (key, options) => this._ctx.events.messageDebug(key, options),
				info: (key, options) => this._ctx.events.messageInfo(key, options),
				warn: (key, options) => this._ctx.events.messageWarn(key, options),
				throw: (key, options) => this._ctx.events.messageThrow(key, options),
			},
			addListener: (handler) => this._ctx.events.setOutputListener(handler)
		}
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
	public moduleContext(): ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: {
				trace: (key, options) => this._ctx.events.signalTrace(key, options),
				debug: (key, options) => this._ctx.events.signalDebug(key, options),
				info: (key, options) => this._ctx.events.signalInfo(key, options),
				warn: (key, options) => this._ctx.events.signalWarn(key, options),
				throw: (key, options) => this._ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => this._ctx.events.messageTrace(key, options),
				debug: (key, options) => this._ctx.events.messageDebug(key, options),
				info: (key, options) => this._ctx.events.messageInfo(key, options),
				warn: (key, options) => this._ctx.events.messageWarn(key, options),
				throw: (key, options) => this._ctx.events.messageThrow(key, options),
			},
			getEvents: (filter) => this._ctx.events.getFilteredEvents(filter)
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
	public actionContext(): ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: {
				trace: (key, options) => this._ctx.events.signalTrace(key, options),
				debug: (key, options) => this._ctx.events.signalDebug(key, options),
				info: (key, options) => this._ctx.events.signalInfo(key, options),
				warn: (key, options) => this._ctx.events.signalWarn(key, options),
				throw: (key, options) => this._ctx.events.signalThrow(key, options),
			},
			message: {
				trace: (key, options) => this._ctx.events.messageTrace(key, options),
				debug: (key, options) => this._ctx.events.messageDebug(key, options),
				info: (key, options) => this._ctx.events.messageInfo(key, options),
				warn: (key, options) => this._ctx.events.messageWarn(key, options),
				throw: (key, options) => this._ctx.events.messageThrow(key, options),
			},
			getEvents: (filter) => this._ctx.events.getFilteredEvents(filter)
		};
	}


	/**
	 * Future extension point:
	 * - Additional tools (plugins, runtime mutation helpers, etc.)
	 */
}
