import {
	buildEvents,
	buildStages,
	buildGlobals,
	buildModules,
	buildTranslations
} from "@builders";
import { Context } from "@contexts";
import { FinalEvents, FinalGlobals, FinalModules, FinalStages, FinalTranslations } from "@data";
import { CoreEngine } from "@engines";
import { CoreError, CoreHelpers } from "@helpers";
import {
	BootstrapManager,
	EventsManager,
	GlobalsManager,
	I18nManager,
	MetaManager,
	ModulesManager,
	ParserManager,
	StagesManager
} from "@managers";
import { CoreProviders } from "@providers";
import { NodeDatetimeProvider } from "@providers/datetime";
import { NodeFsProvider } from "@providers/fs";
import { UlidIdProvider } from "@providers/id";
import { NodeProcessProvider } from "@providers/process";
import {
	ApiService,
	CoreConsoleService,
	RuntimeService,
	SnapshotService,
	ToolsService
} from "@services";
import {
	CLIOptions,
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CLISettings,
	CoreTranslationsShape
} from "@types";

/**
 * TODO: Review instance lifecycle management (remove destroy(), enforce single runtime lifecycle)
 *
 * TODO: Refine public API exposure (hooks accessor vs future higher-level CLI builder)
 */

/**
 * CLI
 *
 * Low-level core entrypoint and composition root.
 *
 * Responsibilities:
 * - Build and validate all core declarations (events, stages, globals, modules, translations)
 * - Instantiate and wire all managers, services and providers
 * - Initialize execution context
 * - Expose developer API (hooks)
 * - Delegate execution to CoreEngine
 *
 * Architectural role:
 * - Acts as the core bootstrapper
 * - Owns full dependency graph construction
 * - Provides the root Context shared across the system
 *
 * Initialization flow:
 * 1. Override settings
 * 2. Setup providers
 * 3. Initialize helpers
 * 4. Initialize EventsManager
 * 5. Initialize core services (console, runtime, tools, snapshot, api)
 * 6. Initialize managers (bootstrap → stages → i18n → parser → globals → modules)
 * 7. Initialize engine
 *
 * Context structure:
 * - settings → global configuration
 * - ready → initialization flags for each component
 * - providers → external abstractions (fs, id, datetime, process)
 * - helpers → core helper utilities
 * - managers/services → runtime components
 *
 * Design principles:
 * - Deterministic initialization order
 * - Explicit dependency wiring
 * - No lazy initialization
 * - Centralized error handling
 *
 * Error handling:
 * - All errors routed through handleCoreError()
 * - CoreError triggers panic
 * - Unknown errors converted to UNHANDLED_ERROR
 *
 * Instance model:
 * - Singleton-like behavior enforced via static flag
 * - Multiple instantiations are forbidden
 *
 * Notes:
 * - This class is a low-level constructor, not final DX layer
 * - Future abstraction (cliCreator) will wrap this API
 * - destroy() exists for testing purposes only (not production design)
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class CLI<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	/**
	 * Singleton guard.
	 */
	private static isInstanciated: boolean = false;

	/**
	 * Internal execution context.
	 */
	private _ctx = {
		settings: {
			coreConsoleLevel: 'info',
			engine: 'fed',
		},
		ready: {
			providers: false,
			events: false,
			coreconsole: false,
			bootstrap: false,
			stages: false,
			i18n: false,
			parser: false,
			globals: false,
			modules: false,
			runtime: false,
			tools: false,
			snapshot: false,
			engine: false
		},
		helpers: { core: {} }
	} as Context<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Private constructor.
	 *
	 * Builds entire core system.
	 */
	private constructor(options: {
		settings?: CLISettings | undefined;
		events: FinalEvents<TEvents>,
		stages: FinalStages<TStages>,
		translations: FinalTranslations<TTranslations>,
		globals: FinalGlobals<TGlobals>,
		modules: FinalModules<TModules>,
	}) {

		this._overrideSettings(options.settings);

		this._ctx.providers = this._setupProviders();
		this._ctx.ready.providers = true;

		this._ctx.helpers.core = new CoreHelpers(this._ctx);
		this._ctx.ready.helpers = true;

		this._ctx.events = new EventsManager(this._ctx, options.events);
		this._ctx.ready.events = true;

		this._ctx.coreconsole = new CoreConsoleService(this._ctx);
		this._ctx.ready.coreconsole = true;

		this._ctx.meta = new MetaManager(this._ctx);
		this._ctx.ready.meta = true;

		this._ctx.runtime = new RuntimeService(this._ctx);
		this._ctx.ready.runtime = true;

		this._ctx.tools = new ToolsService(this._ctx);
		this._ctx.ready.tools = true;

		this._ctx.snapshot = new SnapshotService(this._ctx);
		this._ctx.ready.snapshot = true;

		this._ctx.devapi = new ApiService(this._ctx);
		this._ctx.ready.devapi = true;

		this._ctx.bootstrap = new BootstrapManager(this._ctx);
		this._ctx.ready.bootstrap = true;

		this._ctx.stages = new StagesManager(this._ctx, options.stages);
		this._ctx.ready.stages = true;

		this._ctx.i18n = new I18nManager(this._ctx, options.translations);
		this._ctx.ready.i18n = true;

		this._ctx.parser = new ParserManager(this._ctx);
		this._ctx.ready.parser = true;

		this._ctx.globals = new GlobalsManager(this._ctx, options.globals);
		this._ctx.ready.globals = true;

		this._ctx.modules = new ModulesManager(this._ctx, options.modules);
		this._ctx.ready.modules = true;

		this._ctx.engine = new CoreEngine(this._ctx);
		this._ctx.ready.engine = true;

	}

	/**
	 * Override default CLI settings.
	 */
	private _overrideSettings(settings?: CLISettings) {
		if (settings && settings.defaultStageName) this._ctx.settings.defaultStageName = settings.defaultStageName;
		if (settings && settings.engine) this._ctx.settings.engine = settings.engine;
		if (settings && settings.coreConsoleLevel) this._ctx.settings.coreConsoleLevel = settings.coreConsoleLevel;
	}

	/**
	 * Setup default providers.
	 */
	private _setupProviders(): CoreProviders {
		return {
			id: new UlidIdProvider(),
			process: new NodeProcessProvider(),
			fs: new NodeFsProvider(),
			datetime: new NodeDatetimeProvider()
		}
	}

	/**
	 * Centralized error handler.
	 *
	 * @throws never
	 */
	private static handleCoreError(err: unknown): never {
		if (err instanceof CoreError) {
			CoreError.panic(err.type, err.source, err.desc);
		}

		CoreError.panic(
			"UNHANDLED_ERROR",
			"CLI",
			err instanceof Error ? err.message : "Unknown error"
		);
	}

	/**
	 * Initialize CLI instance.
	 *
	 * Builds all declarations and returns configured CLI.
	 */
	static init<
		const TEvents extends CoreEventsShape,
		const TStages extends CoreStagesShape,
		const TGlobals extends CoreGlobalsShape,
		const TModules extends CoreModulesShape,
		const TTranslations extends CoreTranslationsShape
	>(
		options?: CLIOptions<TEvents, TStages, TGlobals, TModules, TTranslations>,
	): CLI<TEvents, TStages, TGlobals, TModules, TTranslations> {

		try {
			if (CLI.isInstanciated) {
				throw new CoreError(
					"CLI_INSTANCE_DUPLICATED",
					"CLI.init",
					`CLI is already init !`
				)
			}

			this.isInstanciated = true;

			const instance = new CLI({
				settings: options?.settings,
				translations: buildTranslations(options?.translations),
				events: buildEvents(options?.events),
				stages: buildStages(options?.stages),
				globals: buildGlobals(options?.globals),
				modules: buildModules(options?.modules),
			});

			return instance;

		} catch (err) {
			CLI.handleCoreError(err)
		}
	}

	/**
	 * Access developer API (hooks registration).
	 *
	 * @returns ApiService (readonly)
	 */
	public hooks(): Readonly<ApiService<TEvents, TStages, TGlobals, TModules, TTranslations>> {
		return this._ctx.devapi;
	}

	/**
	 * Destroy CLI instance (testing only).
	 */
	public static async destroy() {
		this.isInstanciated = false;
	}

	/**
	 * Execute CLI.
	 *
	 * Delegates to CoreEngine.
	 */
	public async run() {
		try {
			await this._ctx.engine.run()
		}
		catch (err) {
			CLI.handleCoreError(err)
		}
	}
}
