import { Service } from "@abstracts";
import {
	Context,
	EmitMessageHookMethod,
	EmitSignalHookMethod,
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

> extends Service<
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		super(ctx);
	}

	/**
	 * Tools available in stage hooks.
	 *
	 * Limited to signal emission.
	 */
	public stageContext(): ToolsStageContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: (key, options) => this.signal(key, options),
			setCwd: () => { }
		}
	}

	/**
	 * Tools available in globals hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 * - addListener (attach output listeners)
	 */
	public globalsContext(): ToolsGlobalsContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: (key, options) => this.signal(key, options),
			message: (key, options) => this.message(key, options),
			addListener: (handler) => this.ctx.events.setOutputListener(handler)
		}
	}

	/**
	 * Tools available in module hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 */
	public moduleContext(): ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: (key, options) => this.signal(key, options),
			message: (key, options) => this.message(key, options),
		};
	}

	/**
	 * Tools available in action hooks.
	 *
	 * Includes:
	 * - signal
	 * - message
	 */
	public actionContext(): ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations> {
		return {
			signal: (key, options) => this.signal(key, options),
			message: (key, options) => this.message(key, options),
		};
	}

	// -----------------------------------------------------
	// INTERNAL TOOL IMPLEMENTATIONS
	// -----------------------------------------------------

	/**
	 * Emit custom signal event.
	 *
	 * Delegates to EventsManager.emitSignal.
	 */
	private signal: EmitSignalHookMethod<
		TEvents, TStages, TGlobals, TModules, TTranslations
	> = (key, options) => {
		return this.ctx.events.emitSignal(key, options);
	}

	/**
	 * Emit custom message event.
	 *
	 * Delegates to EventsManager.emitMessage.
	 */
	private message: EmitMessageHookMethod<
		TEvents, TStages, TGlobals, TModules, TTranslations
	> = (key, options) => {
		return this.ctx.events.emitMessage(key, options);
	}

	/**
	 * Future extension point:
	 * - Additional tools (plugins, runtime mutation helpers, etc.)
	 */
}
