// NOTE:
// - FedEngine is an event-driven execution engine
// - Runtime lifecycle is orchestrated via event flow listeners
// - Each phase triggers the next through events

// WARNING:
// - Execution order depends on event flow correctness
// - Requires EventsManager to be properly initialized
// - Misconfigured flows can break runtime progression

import { Context } from "@contexts";
import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	EngineState,
	RuntimeAppShape
} from "@types";

/**
 * FedEngine
 *
 * Event-driven engine implementation.
 *
 * Instead of executing phases sequentially,
 * it registers flow listeners that react to lifecycle events carrying
 * `trigger: true`.
 *
 * Flow:
 * runtimeInit → bootstrapReady → stageReady → globalsReady → modulesReady → runtimeReady → runner(action)
 *
 * Responsibilities:
 * - Register flow listeners before runtime starts
 * - Delegate lifecycle progression to EventsManager + RuntimeService
 * - Trigger the final action runner at the end of the flow
 * - Do only the flow orchestration explicitly expected by the core
 *
 * Non-responsibilities:
 * - No direct sequential execution
 * - No manual lifecycle chaining
 * - No passive output listener management
 * - No extra runtime behavior beyond the core-defined flow graph
 * - No custom business logic owned by the engine itself
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class FedEngine<
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
	 * Initialize the FED flow graph and start runtime from its entrypoint.
	 *
	 * Unlike the standard engine, only the first runtime phase is called
	 * directly here. The remaining phases are reached through flow events.
	 */
	async run() {
		await this._registerFlow();

		this._setState('running');

		// Entry point of the flow
		await this._ctx.runtime.setInit();
	}

	/**
	 * Registers all lifecycle event listeners.
	 *
	 * Each listener advances exactly one runtime step when the corresponding
	 * flow event is emitted by the core.
	 *
	 * This method defines the builtin FED graph for the current runtime:
	 * `runtimeInit` → `bootstrapReady` → `stageReady` → `globalsReady` →
	 * `modulesReady` → `runtimeReady` → final action runner.
	 */
	private async _registerFlow() {
		const events = this._ctx.events;

		events.registerFlowListener("runtimeInit", {
			handler: async () => {
				await this._ctx.runtime.setBootstrap();
			}
		});

		events.registerFlowListener("bootstrapReady", {
			handler: async () => {
				await this._ctx.runtime.setStage();
			}
		});

		events.registerFlowListener("stageReady", {
			handler: async () => {
				await this._ctx.runtime.setGlobals();
			}
		});

		events.registerFlowListener("globalsReady", {
			handler: async () => {
				await this._ctx.runtime.setModules();
			}
		});

		events.registerFlowListener("modulesReady", {
			handler: async () => {
				await this._ctx.runtime.setReady();
			}
		});

		events.registerFlowListener("runtimeReady", {
			handler: async () => {
				await this._runner();
			}
		});

		this._setState('done');
	}
}
