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
	HelpersContext
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
	// PluginManager
} from "@managers";
import { CoreEngine } from "@engines";
import { ApiService, CoreConsoleService, RuntimeService, SnapshotService, ToolsService } from "@services";
import { CoreProviders } from "@providers";

/**
 * ContextCoreReady
 *
 * Tracks initialization state of each core component.
 *
 * Purpose:
 * - Ensure lifecycle correctness
 * - Prevent usage of components before they are ready
 *
 * Usage:
 * - Each component should check its corresponding flag before use if required
 */
export interface ContextCoreReady {
	providers: boolean;
	helpers: boolean;
	events: boolean;
	coreconsole: boolean;
	meta: boolean;
	runtime: boolean;
	tools: boolean;
	snapshot: boolean;
	devapi: boolean;
	bootstrap: boolean;
	stages: boolean;
	i18n: boolean;
	parser: boolean;
	globals: boolean;
	modules: boolean;
	engine: boolean;
}

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
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
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
	ready: ContextCoreReady;

	/**
	 * Helpers exposed to the core and hooks.
	 */
	helpers: HelpersContext<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Events system manager.
	 */
	events: EventsManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	// ─────────────────────────────
	// SERVICES
	// ─────────────────────────────

	/**
	 * Core console abstraction (output layer).
	 */
	coreconsole: CoreConsoleService<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Snapshot service (immutable runtime exposure).
	 */
	snapshot: SnapshotService<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Developer API service.
	 */
	devapi: ApiService<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Runtime state orchestration service.
	 */
	runtime: RuntimeService<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Tools exposed to hooks.
	 */
	tools: ToolsService<TEvents, TStages, TGlobals, TModules, TTranslations>;

	// ─────────────────────────────
	// ENGINE
	// ─────────────────────────────

	/**
	 * Core execution engine.
	 */
	engine: CoreEngine<TEvents, TStages, TGlobals, TModules, TTranslations>;

	// ─────────────────────────────
	// MANAGERS
	// ─────────────────────────────

	meta: MetaManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	bootstrap: BootstrapManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	stages: StagesManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	i18n: I18nManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	parser: ParserManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	globals: GlobalsManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	modules: ModulesManager<TEvents, TStages, TGlobals, TModules, TTranslations>;

	// plugins?: future extension point
};
