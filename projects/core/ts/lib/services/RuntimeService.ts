import { ResolverService } from "@abstracts";
import {
	Context,
	RuntimeFullContext,
	RuntimeGlobalsContext,
	RuntimeModuleContext,
	RuntimeStageContext
} from "@contexts";
import {
	CoreError
} from "@helpers";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeFullFacts,
	RuntimeStateEnum,
	RuntimeStateFromLabel,
	RuntimeStateLabel,
	RuntimeStateToLabel,
	RuntimeStateTransitions,
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
 * - Any invalid transition throws a CoreError
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
export class RuntimeService<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape

> extends ResolverService<
	RuntimeFullFacts,
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Current runtime state.
	 */
	private _runtimeState: RuntimeStateEnum;

	/**
	 * Allowed state transitions.
	 *
	 * Key = current state
	 * Value = allowed next states
	 */
	private _runtimeTransitions: RuntimeStateTransitions = {
		0: [RuntimeStateEnum.bootstrap],
		1: [RuntimeStateEnum.stage],
		2: [RuntimeStateEnum.i18n],
		3: [RuntimeStateEnum.globals],
		4: [RuntimeStateEnum.module],
		5: [RuntimeStateEnum.ready],
		6: []
	}

	/**
	 * Constructor.
	 *
	 * Initializes runtime in "init" state.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		super(ctx, {} satisfies RuntimeFullFacts);
		this._runtimeState = RuntimeStateEnum.init;
	}

	/**
	 * Get current runtime state label.
	 *
	 * @returns string
	 */
	public getState(): string {
		return RuntimeStateToLabel[this._runtimeState];
	}

	/**
	 * Check if runtime is in a specific state.
	 *
	 * @param state - State label
	 * @returns boolean
	 */
	public isState(state: RuntimeStateLabel): boolean {
		return this._runtimeState === RuntimeStateFromLabel[state];
	}

	/**
	 * Transition runtime to next state.
	 *
	 * Validates transition against allowed transitions map.
	 *
	 * @param next - Next state enum
	 * @throws CoreError if transition is invalid
	 */
	private _setState(next: RuntimeStateEnum) {
		const currentLabel = RuntimeStateToLabel[this._runtimeState];
		const nextLabel = RuntimeStateToLabel[next];

		if (!this._runtimeTransitions[this._runtimeState].includes(next)) {
			throw new CoreError(
				"INVALID_RUNTIME_TRANSITION",
				"RuntimeService._setState",
				`Cannot transition from ${currentLabel} to ${nextLabel}`
			);
		}
		this._runtimeState = next;
	}

	/**
	 * Initialize runtime.
	 *
	 * Emits:
	 * - runtimeInit
	 */
	public async setInit() {
		await this.ctx.events.internalEmit('runtimeInit');
	}

	/**
	 * Resolve bootstrap phase.
	 *
	 * Steps:
	 * - Emit bootstrapInit
	 * - Resolve BootstrapManager
	 * - Update runtime draft
	 * - Transition state
	 * - Emit bootstrapReady
	 */
	public async setBootstrap() {
		await this.ctx.events.internalEmit('bootstrapInit');
		await this.ctx.bootstrap.resolve();
		this._setState(RuntimeStateEnum.bootstrap);
		this._draft.bootstrap = this.ctx.bootstrap.getResolved();
		await this.ctx.events.internalEmit('bootstrapReady');
	}

	/**
	 * Resolve stage phase.
	 *
	 * Steps:
	 * - Emit stageInit
	 * - Resolve StagesManager
	 * - Update runtime draft
	 * - Resolve i18n (dependent on stage)
	 * - Initialize parser
	 * - Emit stageReady
	 */
	public async setStage() {
		await this.ctx.events.internalEmit('stageInit', {});

		await this.ctx.stages.resolve();

		this._setState(RuntimeStateEnum.stage);
		this._draft.stage = this.ctx.stages.getResolved();

		await this._setI18n();
		await this.ctx.parser.resolve();

		const displayStageName = this.ctx.helpers.core.getDisplayStageName(
			this.ctx.stages.getResolved().name,
			this.ctx.settings.defaultStageName
		);

		await this.ctx.events.internalEmit("stageReady", {
			details: [`${displayStageName}`]
		});
	}

	/**
	 * Resolve i18n phase.
	 *
	 * Internal step triggered after stage resolution.
	 */
	private async _setI18n() {
		await this.ctx.i18n.resolve();
		this._setState(RuntimeStateEnum.i18n);
		this._draft.i18n = this.ctx.i18n.getResolved();
	}

	/**
	 * Resolve globals phase.
	 *
	 * Steps:
	 * - Emit globalsInit
	 * - Resolve GlobalsManager
	 * - Update runtime draft
	 * - Transition state
	 * - Emit globalsReady
	 */
	public async setGlobals() {
		await this.ctx.events.internalEmit('globalsInit');
		await this.ctx.globals.resolve();
		this._setState(RuntimeStateEnum.globals);
		this._draft.globals = this.ctx.globals.getResolved();
		await this.ctx.events.internalEmit('globalsReady');
	}

	/**
	 * Resolve module/action phase.
	 *
	 * Steps:
	 * - Emit actionInit
	 * - Resolve ModulesManager (includes parser.resolveModule)
	 * - Update runtime draft
	 * - Transition state
	 * - Emit actionReady
	 *
	 * Note:
	 * - Module and action are resolved together
	 */
	public async setAction() {
		await this.ctx.events.internalEmit('actionInit');

		await this.ctx.modules.resolve();
		this._setState(RuntimeStateEnum.module);
		this._draft.module = this.ctx.modules.getResolved();

		await this.ctx.events.internalEmit('actionReady');
	}

	/**
	 * Finalize runtime.
	 *
	 * Steps:
	 * - Finalize parser
	 * - Transition to ready state
	 * - Freeze runtime (setResolved)
	 * - Emit runtimeReady
	 */
	public async setReady() {
		await this.ctx.parser.finalize();
		this._setState(RuntimeStateEnum.ready);
		this.setResolved(this._draft);
		this.ctx.events.internalEmit('runtimeReady');
	}

	/**
	 * Stage-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (draft)
	 */
	public stageContext(): RuntimeStageContext {
		return {
			bootstrap: this.ctx.bootstrap.getResolved(),
			stage: this.ctx.stages.getDraft()
		}
	}

	/**
	 * Globals-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (draft)
	 */
	public globalsContext(): RuntimeGlobalsContext {
		return {
			bootstrap: this.ctx.bootstrap.getResolved(),
			stage: this.ctx.stages.getResolved(),
			globals: this.ctx.globals.getDraft()
		}
	}

	/**
	 * Module-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (resolved)
	 * - module (draft)
	 */
	public moduleContext(): RuntimeModuleContext {

		return {
			bootstrap: this.ctx.bootstrap.getResolved(),
			stage: this.ctx.stages.getResolved(),
			globals: this.ctx.globals.getResolved(),
			module: this.ctx.modules.getDraft()
		}
	}

	/**
	 * Full runtime context (final).
	 *
	 * Only available after ready state.
	 */
	public actionContext(): RuntimeFullContext {
		return this.getResolved()
	}
}
