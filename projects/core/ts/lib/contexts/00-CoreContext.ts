// WARNING:
// - This is the central context of the entire core
// - It provides full access to all managers, services, and runtime components
// - Any change here has system-wide impact

// NOTE:
// - Context is intentionally CYCLIC (all components can access each other)
// - Lifecycle safety is ensured via "ready" flags, not by restricting access
// - Consumers MUST respect initialization phases before using components

// TODO: V0.1 — Ensure CORE_STATES alignment with "ready" lifecycle flags
// TODO: ARCHITECTURE (future)
// Evaluate stricter typing or segmented contexts per lifecycle phase if needed

import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CLISettings,
	CoreTranslationsShape,
	HelpersContext,
	RuntimeAppShape,
	CoreEventsChannelsShape
} from "@types";
import {
	EventsManager,
	BootstrapManager,
	MetaManager,
	StagesManager,
	I18nManager,
	GlobalsManager,
	ParserManager,
	ModulesManager,
	RuntimeManager,
	// PluginManager
} from "@managers";
import { CoreEngine } from "@engines";
import { CoreProviders } from "@providers";
import { CoreAPIsContext, CoreServicesContext } from "@contexts";

/**
 * Context
 *
 * Central runtime container for the entire core system.
 *
 * Responsibilities:
 * - Provide access to ALL core components (managers, services, engine)
 * - Maintain shared runtime state
 * - Enable cross-component communication
 *
 * Design:
 * - Fully cyclic access model (no restriction between components)
 * - Lifecycle controlled via "ready" flags
 * - Strongly typed through generics
 *
 * Invariants:
 * - Context is shared across all core components
 * - No component should exist outside of this context
 * - Access does NOT imply readiness (must check lifecycle)
 *
 * @template TEvents - Events definition shape
 * @template TStages - Stages definition shape
 * @template TGlobals - Globals definition shape
 * @template TModules - Modules definition shape
 * @template TTranslations - Translations definition shape
 */
export type Context<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {

	/**
	 * CLI configuration settings.
	 */
	settings: CLISettings;

	/**
	 * External/system providers (env, platform, etc.).
	 */
	providers: CoreProviders;

	/**
	 * Lifecycle readiness flags.
	 */

	/**
	 * Helpers exposed to the core and hooks.
	 */
	helpers: HelpersContext;

	/**
	 * Events system manager.
	 */
	events: EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	// ─────────────────────────────
	// SERVICES
	// ─────────────────────────────
	/**
	 * Snapshot service (immutable runtime exposure).
	 */
	/**
	 * Tools exposed to hooks.
	 */
	/**
	 * Runtime state orchestration service.
	 */
	services: CoreServicesContext;

	/**
	 * Developer API service.
	 */
	/**
	 * Core console abstraction (output layer).
	 */
	api: CoreAPIsContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>

	runtime: RuntimeManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;


	// ─────────────────────────────
	// ENGINE
	// ─────────────────────────────

	/**
	 * Core execution engine.
	 */
	engine: CoreEngine<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	// ─────────────────────────────
	// MANAGERS
	// ─────────────────────────────

	meta: MetaManager;

	bootstrap: BootstrapManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	stages: StagesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	i18n: I18nManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	parser: ParserManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	globals: GlobalsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	modules: ModulesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	// plugins?: future extension point
};
