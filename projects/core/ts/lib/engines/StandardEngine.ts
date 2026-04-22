// NOTE:
// - StandardEngine is the default execution engine
// - It performs a strict, sequential runtime lifecycle
// - All phases are executed synchronously in order

// WARNING:
// - No event-driven flow here (linear execution)
// - RuntimeService is responsible for all state transitions
// - Engine only orchestrates phase order

import { Engine } from "@abstracts";
import { Context } from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types";

/**
 * StandardEngine
 *
 * Default engine implementation using a linear execution model.
 *
 * Lifecycle:
 * 1. init
 * 2. bootstrap
 * 3. stage
 * 4. globals
 * 5. action
 * 6. ready
 * 7. runner execution
 *
 * Responsibilities:
 * - Execute runtime phases in strict order
 * - Delegate all state transitions to RuntimeService
 * - Trigger final runner execution
 *
 * Non-responsibilities:
 * - No event orchestration
 * - No async flow chaining beyond sequencing
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class StandardEngine<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends Engine<TEvents, TStages, TGlobals, TModules, TTranslations> {

	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		protected readonly runner: () => Promise<void> | void
	) {
		super(ctx, runner);
	}

	/**
	 * Executes the full runtime lifecycle sequentially.
	 */
	public async run() {
		this.setState('running');

		// Runtime lifecycle (linear execution)
		await this.ctx.runtime.setInit();
		await this.ctx.runtime.setBootstrap();
		await this.ctx.runtime.setStage();
		await this.ctx.runtime.setGlobals();
		await this.ctx.runtime.setAction();
		await this.ctx.runtime.setReady();

		// Execute final action
		await this.runner();

		this.setState('done');

		// TODO: Emit engine.exit event
	}
}
