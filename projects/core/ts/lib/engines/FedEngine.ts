// NOTE:
// - FedEngine is an event-driven execution engine
// - Runtime lifecycle is orchestrated via event flow listeners
// - Each phase triggers the next through events

// WARNING:
// - Execution order depends on event flow correctness
// - Requires EventsManager to be properly initialized
// - Misconfigured flows can break runtime progression

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
 * FedEngine
 *
 * Event-driven engine implementation.
 *
 * Instead of executing phases sequentially,
 * it registers listeners that react to lifecycle events.
 *
 * Flow:
 * runtimeInit → bootstrapReady → stageReady → globalsReady → actionReady → runtimeReady → runner
 *
 * Responsibilities:
 * - Register flow listeners
 * - Delegate lifecycle progression to EventsManager
 * - Trigger runner at the end of the flow
 *
 * Non-responsibilities:
 * - No direct sequential execution
 * - No manual lifecycle chaining
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class FedEngine<
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
	 * Initializes the event-driven flow and starts runtime.
	 */
	async run() {
		await this._registerFlow();

		this.setState('running');

		// Entry point of the flow
		await this.ctx.runtime.setInit();
	}

	/**
	 * Registers all lifecycle event listeners.
	 *
	 * Each listener triggers the next runtime phase.
	 */
	private async _registerFlow() {
		const events = this.ctx.events;

		events.registerFlowListener("runtimeInit", {
			handler: async () => {
				await this.ctx.runtime.setBootstrap();
			},
			channel: "default"
		});

		events.registerFlowListener("bootstrapReady", {
			handler: async () => {
				await this.ctx.runtime.setStage();
			},
			channel: "default"
		});

		events.registerFlowListener("stageReady", {
			handler: async () => {
				await this.ctx.runtime.setGlobals();
			},
			channel: "default"
		});

		events.registerFlowListener("globalsReady", {
			handler: async () => {
				await this.ctx.runtime.setAction();
			},
			channel: "default"
		});

		events.registerFlowListener("actionReady", {
			handler: async () => {
				await this.ctx.runtime.setReady();
			},
			channel: "default"
		});

		events.registerFlowListener("runtimeReady", {
			handler: async () => {
				await this.runner();
			},
			channel: "default"
		});

		this.setState('done');
	}
}
