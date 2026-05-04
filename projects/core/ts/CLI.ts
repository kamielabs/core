import {
	buildEvents,
	buildStages,
	buildGlobals,
	buildModules,
	buildTranslations
} from "@builders";
import { Context, ContextCoreReady } from "@contexts";
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
 * 1. `CLI.init()` performs declarative building + instance setup
 * 2. constructor wires providers, helpers, and `EventsManager`
 * 3. `run()` performs async manager/service initialization
 * 4. engine starts the actual runtime lifecycle
 *
 * Setup vs init:
 * - setup = synchronous instantiation/wiring of the core graph
 * - init = early runtime readiness phase where managers/services validate,
 *   freeze, and prepare their internal structures
 * - `EventsManager` is the exception: it must be usable from construction time
 *   because the rest of the core cannot meaningfully exist before it
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
 * - Async-capable initialization without lazy runtime wiring
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
	const TEvents extends CoreEventsShape,
	const TStages extends CoreStagesShape,
	const TGlobals extends CoreGlobalsShape,
	const TModules extends CoreModulesShape,
	const TTranslations extends CoreTranslationsShape
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
	 * Performs synchronous setup of the full core object graph.
	 *
	 * This is setup only:
	 * - declarations are already built before construction
	 * - providers/helpers are wired immediately
	 * - `EventsManager` is created immediately
	 * - all other managers/services are only instantiated here and initialized later
	 */
	private constructor(options: {
		settings?: CLISettings | undefined;
		events: FinalEvents<TEvents>,
		stages: FinalStages<TStages>,
		translations: FinalTranslations<TTranslations>,
		globals: FinalGlobals<TGlobals>,
		modules: FinalModules<TModules>,
	}) {

		// Basic CLI settings ovverriding
		this._overrideSettings(options.settings);

		// Providers for external imports in the core
		this._ctx.providers = this._setupProviders();
		this._ctx.ready.providers = true;

		// helpers iare methods available for the core
		this._ctx.helpers.core = new CoreHelpers(this._ctx);
		this._ctx.ready.helpers = true;

		// Eventually the real first class, the events, everything else is based on it
		this._ctx.events = new EventsManager(this._ctx, options.events);
		this._ctx.ready.events = true;

		// Now Managers/Services car be instanciate
		this._setupContext(options);
	}

	/**
	 * Instantiate every manager, service, and engine after the foundational
	 * setup pieces are ready.
	 *
	 * At this stage components are only constructed, not fully initialized.
	 * Their async `init()` methods are executed later by `_initContext()`.
	 */
	private _setupContext(options: {
		settings?: CLISettings | undefined;
		events: FinalEvents<TEvents>,
		stages: FinalStages<TStages>,
		translations: FinalTranslations<TTranslations>,
		globals: FinalGlobals<TGlobals>,
		modules: FinalModules<TModules>,
	}) {

		// Start all services
		this._ctx.coreconsole = new CoreConsoleService(this._ctx);
		this._ctx.runtime = new RuntimeService(this._ctx);
		this._ctx.tools = new ToolsService(this._ctx);
		this._ctx.snapshot = new SnapshotService(this._ctx);
		this._ctx.devapi = new ApiService(this._ctx);

		// Start now managers
		this._ctx.meta = new MetaManager(this._ctx);
		this._ctx.bootstrap = new BootstrapManager(this._ctx);
		this._ctx.stages = new StagesManager(this._ctx, options.stages);
		this._ctx.i18n = new I18nManager(this._ctx, options.translations);
		this._ctx.parser = new ParserManager(this._ctx);
		this._ctx.globals = new GlobalsManager(this._ctx, options.globals);
		this._ctx.modules = new ModulesManager(this._ctx, options.modules);

		// And finally engine
		this._ctx.engine = new CoreEngine(this._ctx);

	}

	/**
	 * Execute the early async initialization phase for all services/managers.
	 *
	 * This is the real pre-runtime readiness pass:
	 * - each component validates and prepares its internal state
	 * - readiness flags are updated as initialization succeeds
	 * - the engine is initialized last because it depends on the rest of the graph
	 */
	private async _initContext() {
		// Services Init First
		await this._initManager('coreconsole', this._ctx.coreconsole.init);
		await this._initManager('runtime', this._ctx.runtime.init);
		await this._initManager('tools', this._ctx.tools.init);
		await this._initManager('snapshot', this._ctx.snapshot.init);
		await this._initManager('devapi', this._ctx.devapi.init);


		await this._initManager('meta', this._ctx.meta.init);
		await this._initManager('bootstrap', this._ctx.bootstrap.init);
		await this._initManager('stages', this._ctx.stages.init);
		await this._initManager('i18n', this._ctx.i18n.init);
		await this._initManager('parser', this._ctx.parser.init);
		await this._initManager('globals', this._ctx.globals.init);
		await this._initManager('modules', this._ctx.modules.init);

		await this._initManager('engine', this._ctx.engine.init);
	}

	/**
	 * Initialize one context component and mark its readiness flag.
	 */
	private async _initManager<K extends keyof ContextCoreReady>(
		key: K,
		init: () => Promise<void>
	) {
		await init();
		this._ctx.ready[key] = true;
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
	 * This method normalizes both `CoreError` and unexpected thrown errors into
	 * the same final panic path, so raw Node.js stacks do not leak into the
	 * default CLI output.
	 *
	 * @throws never
	 */
	private static handleCoreError(err: unknown, desc?: string): never {
		if (err instanceof CoreError) {
			CoreError.panic(err.key, err.desc);
		}

		if (err instanceof Error) {
			CoreError.panic("unknownError", err.message);
		}


		CoreError.panic(
			"unknownError",
			desc ?? "Unknown CLI Error"
		);
	}

	/**
	 * Build the public CLI instance from declarative user options.
	 *
	 * This is the public setup entrypoint:
	 * - runs every builder in the pre-init phase
	 * - validates builder-level constraints through `CoreError`
	 * - constructs the CLI object graph
	 *
	 * It does not start manager/service async initialization yet.
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
					"instanceDuplicated",
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
	 * Expose the full internal context.
	 *
	 * This remains a low-level surface intended mostly for internal work and
	 * advanced debugging; the stable developer-facing API is `hooks()`.
	 */
	public ctx(): Readonly<Context<TEvents, TStages, TGlobals, TModules, TTranslations>> {
		return this._ctx;
	}

	/**
	 * Destroy CLI instance (testing only).
	 */
	public static async destroy() {
		this.isInstanciated = false;
	}

	/**
	 * Execute the CLI runtime.
	 *
	 * Steps:
	 * - initialize services/managers in their early runtime phase
	 * - delegate lifecycle execution to the selected engine
	 */
	public async run() {
		try {
			// Init and freeze for real all services and managers now we start the core
			await this._initContext();
			// Run the full Runtime with all customization, hooks, etc 
			await this._ctx.engine.run();
		}
		catch (err) {
			CLI.handleCoreError(err);
		}
	}
}
