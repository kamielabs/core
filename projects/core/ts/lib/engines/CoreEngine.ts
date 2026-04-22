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
import { Engine } from "@abstracts";
import { BUILTIN_ENGINES } from "@data";
import { CoreError } from "@helpers";

/**
 * CoreEngine
 *
 * Engine selector responsible for:
 * - Resolving the engine implementation from settings
 * - Instantiating the selected engine
 * - Delegating execution to it
 *
 * Responsibilities:
 * - Select engine from BUILTIN_ENGINES
 * - Inject context and runner into the engine
 * - Delegate run() execution
 *
 * Non-responsibilities:
 * - No lifecycle orchestration
 * - No runtime state management
 * - No execution logic
 *
 * These are handled by the selected Engine implementation.
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

	/**
	 * Selected engine instance.
	 */
	private engine: Engine<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	>;

	/**
	 * Execution runner resolved from ModulesManager.
	 */
	private runner: () => Promise<void> | void;

	constructor(private ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {

		/**
		 * Resolve runner from modules manager.
		 */
		this.runner = this.ctx.modules.runner;

		/**
		 * Resolve engine name from settings (default: "std").
		 */
		const engineName = this.ctx.settings.engine ?? 'std';

		/**
		 * Resolve engine class from built-ins.
		 */
		const classEngine = BUILTIN_ENGINES[engineName];

		if (!classEngine) {
			throw new CoreError(
				"Fatal",
				"Engine Selector",
				`Unknown engine: ${engineName}`
			);
		}

		/**
		 * Instantiate selected engine.
		 */
		this.engine = new classEngine(ctx, this.runner);
	}

	/**
	 * Delegates execution to the selected engine.
	 */
	async run() {
		return await this.engine.run();
	}
}
