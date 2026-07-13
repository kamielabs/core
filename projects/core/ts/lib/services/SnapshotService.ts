import {
	Context,
	SnapshotFullContext
} from "@contexts";
import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape,
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
export class SnapshotService {

	/**
	 * Constructor.
	 *
	 */
	private constructor() { }

	public static create(): SnapshotService {
		return new SnapshotService();
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
	public snapshotContext<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations> {

		const snap: SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations> = {
			meta: ctx.meta.getMeta(),
			settings: ctx.settings,
			events: ctx.events.getDict(),
			channels: ctx.events.getChannels(),
			stages: ctx.stages.getDict(),
			i18n: ctx.i18n.getDict(),
			globals: ctx.globals.getDict(),
			modules: ctx.modules.getDict(),
		}

		return snap
	}
}
