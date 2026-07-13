// NOTE:
// - StandardEngine is the default execution engine
// - It performs a strict, sequential runtime lifecycle
// - All phases are executed synchronously in order

// WARNING:
// - No event-driven flow here (linear execution)
// - RuntimeService is responsible for all state transitions
// - Engine only orchestrates phase order

import { Context } from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape,
	EngineState,
	CoreEventsChannelsShape
} from "@types";

/**
 * StandardEngine
 *
 * Default engine implementation using a linear execution model.
 *
 * Execution model:
 * - procedural
 * - explicit phase calls
 * - no flow-listener registration
 *
 * Lifecycle:
 * 1. init
 * 2. bootstrap
 * 3. stage
 * 4. globals
 * 5. modules
 * 6. ready
 * 7. runner execution (action)
 *
 * Responsibilities:
 * - Execute runtime phases in strict order
 * - Delegate all phase transitions to RuntimeService via direct `set*()` calls
 * - Trigger final runner execution once runtime is fully ready
 * - Do only the orchestration explicitly expected by the core
 *
 * Non-responsibilities:
 * - No event orchestration
 * - No async flow chaining beyond sequencing
 * - No FED trigger/listener behavior
 * - No extra runtime behavior beyond the core-defined phase chain
 * - No custom business logic owned by the engine itself
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class StandardEngine<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private _ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	private _state: EngineState = "idle";
	private _runner: () => Promise<void> | void

	constructor(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		runner: () => Promise<void> | void
	) {
		this._ctx = ctx;
		this._runner = runner;
	}


	/**
	 * Update the internal engine state.
	 */
	private _setState(next: EngineState): void {
		this._state = next;
	}

	/**
	 * Return the current engine execution state.
	 */
	public getState(): EngineState {
		return this._state;
	}

	/**
	 * Execute the full runtime lifecycle sequentially.
	 *
	 * Order is entirely procedural:
	 * `setInit()` → `setBootstrap()` → `setStage()` → `setGlobals()` →
	 * `setModules()` → `setReady()` → final runner.
	 */
	public async run() {
		this._setState('running');

		// Runtime lifecycle (linear execution)
		await this._ctx.runtime.setInit();
		await this._ctx.runtime.setBootstrap();
		await this._ctx.runtime.setStage();
		await this._ctx.runtime.setGlobals();
		await this._ctx.runtime.setModules();
		await this._ctx.runtime.setReady();

		// Execute final action
		await this._runner();

		this._setState('done');

		// TODO: Emit engine.exit event
	}
}
