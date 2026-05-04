// NOTE:
// - CoreEngine is a selector, not an execution engine itself
// - It resolves and instantiates the correct engine implementation
// - Actual execution logic is delegated to the selected Engine

// WARNING:
// - Engine selection is based on CLI settings
// - Unknown engines result in a fatal error
// - Runner is resolved from ModulesManager and injected into the engine

// TODO: V0.x — Refactor into EngineManager to align with core architecture (Managers pattern)
// TODO: V2.0 — Make engines fully generic with global core shape

import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types";
import { Context } from "@contexts";
import { BUILTIN_ENGINES } from "@data";
import { StandardEngine } from "./StandardEngine";
import { FedEngine } from "./FedEngine";

/**
 * CoreEngine
 *
 * Engine selector responsible for:
 * - Resolving the engine implementation from settings
 * - Instantiating the selected engine
 * - Delegating execution to it
 *
 * Responsibilities:
 * - Select one builtin engine from `BUILTIN_ENGINES`
 * - Inject context and the final action runner into the engine
 * - Delegate run() execution
 *
 * Supported engine families:
 * - `StandardEngine` → procedural phase execution
 * - `FedEngine` → flow-listener registration and event-driven execution
 *
 * Non-responsibilities:
 * - No lifecycle orchestration
 * - No runtime state management
 * - No execution logic
 * - No custom engine registry yet
 *
 * These are handled by the selected Engine implementation.
 *
 * Architectural note:
 * - This class is currently a selector/factory
 * - It is expected to evolve later into an `EngineManager`
 * - Engine instances currently receive the full context, even though the
 *   long-term target is a tighter surface exposing only phase setters and runner
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class CoreEngine<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	/**
	 * Selected engine instance.
	 */
	private engine!: StandardEngine<TEvents, TStages, TGlobals, TModules, TTranslations>
		| FedEngine<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Execution runner resolved from ModulesManager.
	 *
	 * This is the final action runner consumed by the selected engine once all
	 * runtime phases have been completed.
	 */
	private runner!: () => Promise<void> | void;

	constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		this._ctx = ctx;
	}

	/**
	 * Resolve the selected builtin engine and inject its execution dependencies.
	 *
	 * Current inputs:
	 * - runtime settings engine selector
	 * - `ModulesManager.runner()`
	 *
	 * Current limitation:
	 * - only builtin standard/FED engines are supported
	 */
	public init: () => Promise<void> = async (): Promise<void> => {
		/**
		 * Resolve runner from modules manager.
		 */
		this.runner = this._ctx.modules.runner;
		if (!this.runner) {
			this._ctx.events.throw('engineUnknownRunner');
		}

		/**
		 * Resolve engine name from settings (default: "std").
		 */
		const engineName = this._ctx.settings.engine ?? 'std';

		/**
		 * Resolve engine class from built-ins.
		 */
		const classEngine = BUILTIN_ENGINES[engineName];

		if (!classEngine) {
			this._ctx.events.throw('engineUnknown');
		}

		/**
		 * Instantiate selected engine.
		 */
		this.engine = new classEngine(this._ctx, this.runner);

	}

	/**
	 * Delegate execution to the selected engine instance.
	 */
	async run() {
		return await this.engine.run();
	}
}
