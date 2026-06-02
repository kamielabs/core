import {
	Context,
	RuntimeFullContext,
	RuntimeGlobalsContext,
	RuntimeModuleContext,
	RuntimeStageContext
} from "@contexts";
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
	 * - Any invalid transition emits a terminal runtime event
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

> {
	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	private _draft?: RuntimeFullFacts | undefined;
	private _resolved?: RuntimeFullFacts;
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
	constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		this._ctx = ctx;
		this._draft = {} satisfies RuntimeFullFacts;
		this._runtimeState = RuntimeStateEnum.init;
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

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
	 */
	private _setState(next: RuntimeStateEnum) {
		const currentLabel = RuntimeStateToLabel[this._runtimeState];
		const nextLabel = RuntimeStateToLabel[next];

		if (!this._runtimeTransitions[this._runtimeState].includes(next)) {
			this._ctx.events.throw('runtimeInvalidTransition', {
				details: [
					`current: ${currentLabel}`,
					`next: ${nextLabel}`
				]
			})
		}
		this._runtimeState = next;
	}

	/**
	 * Drop the mutable runtime draft once the final runtime has been frozen.
	 */
	private _clearDraft() {
		this._draft = undefined;
	}

	/**
	 * Freeze and persist the final resolved runtime facts.
	 *
	 * This method is intended to run exactly once, at the end of the lifecycle.
	 */
	private _setResolved(state: RuntimeFullFacts): void | never {
		if (this._resolved) {
			this._ctx.events.throw('runtimeAlreadyResolved');
		}
		this._resolved = this._ctx.helpers.core.deepClone(state);
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	public getDraft(): RuntimeFullFacts {
		if (!this._draft) {
			this._ctx.events.throw('runtimeMissingDraft');
		}
		return this._draft;
	}
	/**
	 * Returns resolved state.
	 *
	 * @throws CoreError if not resolved
	 */
	public getResolved(): RuntimeFullFacts {
		if (!this._resolved) {
			this._ctx.events.throw('runtimeMissingResolved');
		}
		return this._resolved;
	}

	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
	}

	/**
	 * Initialize runtime.
	 *
	 * Emits:
	 * - runtimeInit
	 */
	public async setInit() {
		await this._ctx.events.emit('runtimeInit');
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
		await this._ctx.events.emit('bootstrapInit');
		await this._ctx.bootstrap.resolve();
		this._setState(RuntimeStateEnum.bootstrap);
		this.getDraft().bootstrap = this._ctx.bootstrap.getResolved();
		await this._ctx.events.emit('bootstrapReady');
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
		await this._ctx.events.emit('stageInit');

		await this._ctx.stages.resolve();

		const stage = this._ctx.stages.getResolved();

		this._setState(RuntimeStateEnum.stage);
		this.getDraft().stage = stage;

		await this._setI18n();
		await this._setParser();

		const displayStageName = this._ctx.helpers.core.getDisplayStageName(
			stage.name,
			this._ctx.settings.defaultStageName
		);

		await this._ctx.events.emit("stageReady", {
			values: { stage: `${displayStageName}` }
		});
	}

	/**
	 * Initialize parser resolution for the current runtime cycle.
	 *
	 * This internal step emits `parserInit` and lets `ParserManager`
	 * accumulate parsing state inside its own draft store.
	 */
	private async _setParser() {
		await this._ctx.events.emit('parserInit');
		await this._ctx.parser.resolve();
	}

	/**
	 * Resolve i18n phase.
	 *
	 * Internal step triggered after stage resolution.
	 *
	 * It resolves the active language, freezes runtime i18n facts
	 * and injects them into the runtime draft before the parser is finalized.
	 */
	private async _setI18n() {
		await this._ctx.events.emit('i18nInit');
		await this._ctx.i18n.resolve();
		this._setState(RuntimeStateEnum.i18n);
		const i18n = this._ctx.i18n.getResolved();
		this.getDraft().i18n = i18n;
		await this._ctx.events.emit('i18nReady');
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
		await this._ctx.events.emit('globalsInit');
		await this._ctx.globals.resolve();
		this._setState(RuntimeStateEnum.globals);
		this.getDraft().globals = this._ctx.globals.getResolved();
		await this._ctx.events.emit('globalsReady', {
			values: {
				globals: JSON.stringify(this.getDraft().globals!, null, 4)
			}
		});
	}

	/**
	 * Resolve module/action phase.
	 *
	 * Steps:
	 * - Emit modulesInit
	 * - Resolve ModulesManager (includes parser.resolveModule)
	 * - Update runtime draft
	 * - Transition state
	 * - Emit modulesReady
	 *
	 * Note:
	 * - Module and action are resolved together
	 */
	public async setModules() {
		await this._ctx.events.emit('modulesInit');
		await this._ctx.modules.resolve();
		this._setState(RuntimeStateEnum.module);
		this.getDraft().module = this._ctx.modules.getResolved();
		await this._ctx.events.emit('modulesReady');
	}

	/**
	 * Finalize runtime.
	 *
	 * Steps:
	 * - Finalize parser
	 * - Emit parserReady
	 * - Transition to ready state
	 * - Freeze runtime (setResolved)
	 * - Emit runtimeReady
	 */
	public async setReady() {
		this._ctx.parser.finalize();
		await this._ctx.events.emit('parserReady');
		this.getDraft().parser = this._ctx.parser.getResolved();
		this._setState(RuntimeStateEnum.ready);
		this._setResolved(this._ctx.helpers.core.deepClone(this.getDraft()));
		this._clearDraft();
		await this._ctx.events.emit('runtimeReady');
	}

	/**
	 * Stage-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (draft from StagesManager)
	 *
	 * This is the earliest runtime view exposed to hooks.
	 */
	public stageContext(): RuntimeStageContext {
		return {
			bootstrap: this._ctx.bootstrap.getResolved(),
			stage: this._ctx.stages.getDraft()
		}
	}

	/**
	 * Globals-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (draft from GlobalsManager)
	 */
	public globalsContext(): RuntimeGlobalsContext {
		return {
			bootstrap: this._ctx.bootstrap.getResolved(),
			stage: this._ctx.stages.getResolved(),
			globals: this._ctx.globals.getDraft()
		}
	}

	/**
	 * Module-level runtime context.
	 *
	 * Includes:
	 * - bootstrap (resolved)
	 * - stage (resolved)
	 * - globals (resolved)
	 * - module (draft from ModulesManager)
	 */
	public moduleContext(): RuntimeModuleContext {

		return {
			bootstrap: this._ctx.bootstrap.getResolved(),
			stage: this._ctx.stages.getResolved(),
			globals: this._ctx.globals.getResolved(),
			module: this._ctx.modules.getDraft()
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
