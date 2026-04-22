// TODO: V0.1 — Unify state handling with CORE_STATES system (replace local draft/resolved patterns if needed)
// TODO: V0.2 — Convert all abstract classes to interfaces + concrete implementations (implements instead of extends)
// WARNING: This file defines core architectural primitives — any change here has system-wide impact

import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	EngineState,
	CoreModulesShape,
	CoreTranslationsShape
} from "@types";
import { Context } from "@contexts";
import { CoreError } from "@helpers";

/**
 * BaseComponent
 *
 * Root abstraction for all core components.
 * Provides access to the shared Context.
 *
 * @template TEvents - Events definition shape
 * @template TStages - Stages definition shape
 * @template TGlobals - Globals definition shape
 * @template TModules - Modules definition shape
 * @template TTranslations - Translations definition shape
 */
export abstract class BaseComponent<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {
	protected constructor(
		/**
		 * Shared runtime context (immutable reference)
		 */
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>
	) { }
}

/**
 * BaseDictComponent
 *
 * Extension of BaseComponent for components backed by a dictionary (configuration / registry).
 * Provides controlled access and optional deep freeze capability.
 *
 * @template TDict - Dictionary shape
 */
export abstract class BaseDictComponent<
	TDict,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseComponent<TEvents, TStages, TGlobals, TModules, TTranslations> {

	protected constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		/**
		 * Internal dictionary (mutable until frozen)
		 */
		protected _dict: TDict
	) {
		super(ctx);
	}

	/**
	 * Deeply freezes an object and all nested properties.
	 *
	 * WARNING:
	 * - Mutates the input object
	 * - No circular reference protection
	 *
	 * @param obj - Object to freeze
	 * @returns Frozen object
	 */
	private _deepFreeze<T>(obj: T): T {
		if (!obj || typeof obj !== "object") return obj;

		Object.freeze(obj);

		for (const key of Object.keys(obj as any)) {
			const value = (obj as any)[key];
			if (value && typeof value === "object" && !Object.isFrozen(value)) {
				this._deepFreeze(value);
			}
		}

		return obj;
	}

	/**
	 * Returns the dictionary (no defensive copy).
	 *
	 * WARNING:
	 * - Consumers must respect immutability after freeze
	 */
	public getDict(): TDict {
		return this._dict as TDict;
	}

	/**
	 * Freezes the dictionary deeply.
	 *
	 * Should be called once initialization phase is complete.
	 */
	public freezeDict() {
		this._deepFreeze(this._dict);
	}
}

/**
 * Engine
 *
 * Represents the execution engine of the CLI.
 * Responsible for orchestrating the runtime flow and executing the runner.
 *
 * Invariant:
 * - Single engine instance per execution
 */
export abstract class Engine<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseComponent<TEvents, TStages, TGlobals, TModules, TTranslations> {

	/**
	 * Current engine state
	 */
	protected state: EngineState = "idle";

	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		/**
		 * Execution entry point (resolved by managers)
		 */
		protected readonly runner: () => Promise<void> | void
	) {
		super(ctx);
	}

	/**
	 * Updates engine state.
	 *
	 * @param next - Next state
	 */
	protected setState(next: EngineState) {
		this.state = next;
	}

	/**
	 * Returns current engine state.
	 */
	public getState() {
		return this.state;
	}

	/**
	 * Executes the engine flow.
	 */
	public abstract run(): Promise<void> | void;
}

/**
 * ResolverManager
 *
 * Stateless resolver with a 2-phase lifecycle:
 * 1. Draft (mutable)
 * 2. Resolved (immutable)
 *
 * Used for deterministic state computation.
 *
 * Invariants:
 * - Draft must exist before access
 * - Resolved can only be set once
 * - Resolved state is frozen
 */
export abstract class ResolverManager<
	TResolved,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseComponent<TEvents, TStages, TGlobals, TModules, TTranslations> {

	private _draft?: TResolved | undefined;
	private _resolved?: TResolved;

	/**
	 * Sets draft state.
	 */
	protected setDraft(state: TResolved) {
		this._draft = state;
	}

	/**
	 * Returns draft state.
	 *
	 * @throws CoreError if not initialized
	 */
	public getDraft(): TResolved {
		if (!this._draft) {
			throw new CoreError(
				"STATE_NOT_DRAFT",
				"ResolverManager.getDraft",
				"Draft state not available"
			);
		}
		return this._draft;
	}

	/**
	 * Clears draft state.
	 */
	protected clearDraft() {
		this._draft = undefined;
	}

	/**
	 * Finalizes state (immutable).
	 *
	 * @throws CoreError if already resolved
	 */
	protected setResolved(state: TResolved) {
		if (this._resolved) {
			throw new CoreError(
				"STATE_ALREADY_RESOLVED",
				"ResolverManager.setResolved",
				"State already resolved."
			);
		}
		this._resolved = Object.freeze(state);
	}

	/**
	 * Returns resolved state.
	 *
	 * @throws CoreError if not resolved
	 */
	public getResolved(): TResolved {
		if (!this._resolved) {
			throw new CoreError(
				"STATE_NOT_RESOLVED",
				"ResolverManager.getResolved",
				"State not resolved yet."
			);
		}
		return this._resolved!;
	}

	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
	}

	/**
	 * Performs resolution logic.
	 */
	public abstract resolve(): void | Promise<void>;
}

/**
 * ResolverManagerWithDict
 *
 * Same as ResolverManager but backed by a dictionary.
 */
export abstract class ResolverManagerWithDict<
	TDict,
	TResolved,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseDictComponent<TDict, TEvents, TStages, TGlobals, TModules, TTranslations> {

	private _draft?: TResolved | undefined;
	private _resolved?: TResolved;

	protected setDraft(state: TResolved) {
		this._draft = state;
	}

	public getDraft(): TResolved {
		if (!this._draft) {
			throw new CoreError(
				"STATE_NOT_DRAFT",
				`${this.constructor.name}.getDraft`,
				"Draft state not available"
			);
		}
		return this._draft;
	}

	protected clearDraft() {
		this._draft = undefined;
	}

	protected setResolved(state: TResolved) {
		if (this._resolved) {
			throw new CoreError(
				"STATE_DUPLICATE_RESOLVED",
				`${this.constructor.name}.setResolved`,
				"State already resolved!"
			);
		}
		this._resolved = Object.freeze(state);
	}

	public getResolved(): TResolved {
		if (!this._resolved) {
			throw new CoreError(
				"STATE_NOT_RESOLVED",
				`${this.constructor.name}.getResolved`,
				"State not resolved yet"
			);
		}
		return this._resolved;
	}

	public isResolved(): boolean {
		return !!this._resolved;
	}

	public abstract resolve(): void | Promise<void>;
}

/**
 * LiveManager
 *
 * Holds a mutable "live" state.
 *
 * Unlike resolvers:
 * - No draft/resolved lifecycle
 * - Always mutable
 */
export abstract class LiveManager<
	TLive,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseComponent<TEvents, TStages, TGlobals, TModules, TTranslations> {

	protected _live: TLive;

	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		live: TLive
	) {
		super(ctx);
		this._live = live;
	}

	/**
	 * Returns live state.
	 */
	public getLive(): TLive {
		return this._live;
	}
}

/**
 * LiveManagerWithDict
 *
 * LiveManager + dictionary support.
 */
export abstract class LiveManagerWithDict<
	TDict,
	TLive,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseDictComponent<TDict, TEvents, TStages, TGlobals, TModules, TTranslations> {

	protected _live: TLive;

	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		dict: TDict,
		live: TLive
	) {
		super(ctx, dict);
		this._live = live;
	}

	public getLive(): TLive {
		return this._live;
	}
}

/**
 * Service
 *
 * Base class for services.
 * Typically used for orchestration or cross-cutting concerns.
 */
export abstract class Service<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends BaseComponent<
	TEvents, TStages, TGlobals, TModules, TTranslations
> {
	protected constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		super(ctx);
	}
}

/**
 * ResolverService
 *
 * Service-level resolver with internal state lifecycle.
 *
 * Difference vs ResolverManager:
 * - Service-oriented usage
 * - Draft initialized at construction
 */
export abstract class ResolverService<
	TResolved,
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends Service<
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	protected _draft: TResolved;
	protected _resolved?: TResolved;

	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		state: TResolved
	) {
		super(ctx);
		this._draft = state;
	}

	public getDraft(): TResolved {
		if (!this._draft) {
			throw new CoreError(
				"STATE_NOT_DRAFT",
				`${this.constructor.name}.getDraft`,
				"Draft state not available"
			);
		}
		return this._draft;
	}

	protected setResolved(state: TResolved) {
		if (this._resolved) {
			throw new CoreError(
				"STATE_ALREADY_RESOLVED",
				`${this.constructor.name}.setResolved`,
				"State already resolved"
			);
		}
		this._resolved = Object.freeze(state);
	}

	public getResolved(): TResolved {
		if (!this._resolved) {
			throw new CoreError(
				"STATE_NOT_RESOLVED",
				`${this.constructor.name}.getResolved`,
				"State not resolved yet"
			);
		}
		return this._resolved;
	}

	public isResolved(): boolean {
		return !!this._resolved;
	}
}
