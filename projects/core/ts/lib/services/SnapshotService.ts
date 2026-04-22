import { Service } from "@abstracts";
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
> extends Service<
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(protected readonly ctx: Context<
		TEvents, TStages, TGlobals, TModules, TTranslations
	>) {
		super(ctx);
	}

	/**
	 * Return full snapshot of core declarations.
	 *
	 * Behavior:
	 * - Aggregates all manager dictionaries into a single object
	 * - Provides read-only access to declared structures
	 * - Safe to call at any time during lifecycle
	 *
	 * @returns SnapshotFullContext
	 */
	public snapshotContext(): SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations> {

		const snap: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations> = {
			settings: this.ctx.settings,
			events: this.ctx.events.getDict(),
			stages: this.ctx.stages.getDict().stages,
			i18n: this.ctx.i18n.getDict().translations,
			globals: this.ctx.globals.getDict().options,
			modules: this.ctx.modules.getDict().modules,
		}

		return snap
	}
}
