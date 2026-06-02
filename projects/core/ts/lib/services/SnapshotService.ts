import {
	Context,
	SnapshotFullContext
} from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
} from "@types";

/**
 * SnapshotService
 *
 * Read-only exposure service for core declarations.
 *
 * Responsibilities:
 * - Provide a consistent snapshot of all core configuration dictionaries
 * - Expose static data structures (settings, events, stages, globals, modules, i18n)
 * - Allow hooks to inspect the full declared configuration at any time
 *
 * Scope:
 * - Only returns declaration data (no runtime state)
 * - No mutation, no transformation, no logic
 *
 * Snapshot content:
 * - settings → CLI configuration
 * - events → event definitions
 * - stages → stage declarations
 * - i18n → translations dictionary
 * - globals → global options declaration
 * - modules → module definitions
 *
 * Design principles:
 * - Pure read-only access
 * - No side effects
 * - No dependency on runtime lifecycle state
 * - Always available (safe to call from any hook)
 *
 * Guarantees:
 * - All managers are initialized before usage
 * - All dictionaries are validated at construction time
 * - Snapshot is consistent and immutable from consumer perspective
 *
 * Usage:
 * - Accessed via ctx.snapshot.snapshotContext()
 * - Intended for inspection, debugging, and advanced hook logic
 *
 * Notes:
 * - This service must remain minimal and stable
 * - No runtime logic should be introduced here
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class SnapshotService<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(ctx: Context<
		TEvents, TStages, TGlobals, TModules, TTranslations
	>) {
		this._ctx = ctx;
	}

	public init: () => Promise<void> = async (): Promise<void> => { };
	/**
	 * Return full snapshot of core declarations.
	 *
	 * Behavior:
	 * - Aggregates all manager dictionaries into a single object
	 * - Provides read-only access to declared structures
	 * - Intended to be called once the core context has been initialized
	 *
	 * @returns SnapshotFullContext
	 */
	public snapshotContext(): SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations> {

		const snap: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations> = {
			meta: this._ctx.meta.getMeta(),
			settings: this._ctx.settings,
			events: this._ctx.events.getDict(),
			stages: this._ctx.stages.getDict(),
			i18n: this._ctx.i18n.getDict(),
			globals: this._ctx.globals.getDict(),
			modules: this._ctx.modules.getDict(),
		}

		return snap
	}
}
