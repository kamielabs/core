import { ApiService, CoreConsoleService } from "@api";
import {
	buildEvents,
	buildStages,
	buildGlobals,
	buildModules,
	buildTranslations,
	buildChannels
} from "@builders";
import { Context } from "@contexts";
import { CoreEngine } from "@engines";
import { CoreError, CoreEventError, CoreHelpers, ModulesHelpers, ParserHelpers } from "@helpers";
import {
	BootstrapManager,
	EventsManager,
	GlobalsManager,
	I18nManager,
	MetaManager,
	ModulesManager,
	ParserManager,
	RuntimeManager,
	StagesManager
} from "@managers";
import { CoreProviders } from "@providers";
import { NodeDatetimeProvider } from "@providers/datetime";
import { NodeFsProvider } from "@providers/fs";
import { UlidIdProvider } from "@providers/id";
import { NodeProcessProvider } from "@providers/process";
import {
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
	CoreTranslationsShape,
	CLIUserSettings,
	RuntimeAppShape,
	CoreEventsChannelsShape
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
	const TChannels extends CoreEventsChannelsShape,
	const TStages extends CoreStagesShape,
	const TGlobals extends CoreGlobalsShape,
	const TModules extends CoreModulesShape,
	const TTranslations extends CoreTranslationsShape,
	const TApp extends RuntimeAppShape
> {

	/**
	 * Internal execution context.
	 */
	private _ctx = {
		settings: {
			skipI18nWarnings: false,
			console: {
				level: 'info',
				scope: 'app',
				showScope: false,
				showOrigin: false,
				showLevel: false,
				showTS: false,
				showPhase: false,
			},
			engine: 'fed',
		},
		helpers: { core: {} },
		services: { snapshot: {}, tools: {}, runtime: {} },
		api: { console: {}, devapi: {} }
	} as Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

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
	private constructor(options: CLIUserSettings<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {

		// Basic CLI settings ovverriding
		this._overrideSettings(options.settings);

		// Providers for external imports in the core
		this._ctx.providers = this._setupProviders();

		// helpers iare methods available for the core
		this._ctx.helpers.core = CoreHelpers.create(this._ctx);
		this._ctx.helpers.parser = ParserHelpers.create();
		this._ctx.helpers.modules = ModulesHelpers.create();

		// Eventually the real first class, the events, everything else is based on it
		this._ctx.events = EventsManager.create(this._ctx, options.events, options.channels);

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
	private _setupContext(options: CLIUserSettings<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {

		// Start all APIs
		this._ctx.api.console = CoreConsoleService.create(this._ctx);
		this._ctx.api.devapi = ApiService.create(this._ctx);

		// start runtimeManager
		this._ctx.runtime = RuntimeManager.create(this._ctx, options.app || {} as TApp);

		// start all Services
		this._ctx.services.runtime = RuntimeService.create();
		this._ctx.services.tools = ToolsService.create();
		this._ctx.services.snapshot = SnapshotService.create();

		// Start now managers
		this._ctx.meta = MetaManager.create(this._ctx, options.meta);
		this._ctx.bootstrap = BootstrapManager.create(this._ctx);
		this._ctx.stages = StagesManager.create(this._ctx, options.stages);
		this._ctx.i18n = I18nManager.create(this._ctx, options.translations);
		this._ctx.parser = ParserManager.create(this._ctx);
		this._ctx.globals = GlobalsManager.create(this._ctx, options.globals);
		this._ctx.modules = ModulesManager.create(this._ctx, options.modules);

		// And finally engine
		this._ctx.engine = CoreEngine.create(this._ctx);

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
		await this._ctx.api.console.init();
		await this._ctx.runtime.init();
		await this._ctx.services.tools.init();
		await this._ctx.services.snapshot.init();
		await this._ctx.api.devapi.init();


		await this._ctx.meta.init();
		await this._ctx.bootstrap.init();
		await this._ctx.stages.init();
		await this._ctx.i18n.init();
		await this._ctx.parser.init();
		await this._ctx.globals.init();
		await this._ctx.modules.init();

		await this._ctx.engine.init();
	}

	/**
	 * Override default CLI settings.
	 */
	private _overrideSettings(settings?: CLISettings) {
		if (settings !== undefined) {
			if (settings.defaultStageName !== undefined) this._ctx.settings.defaultStageName = settings.defaultStageName;
			if (settings.skipI18nWarnings !== undefined) this._ctx.settings.skipI18nWarnings = settings.skipI18nWarnings;
			if (settings.engine !== undefined) this._ctx.settings.engine = settings.engine;
			if (settings.console !== undefined) {
				this._ctx.settings.console ??= {};
				if (settings.console.level !== undefined) this._ctx.settings.console.level = settings.console.level;
				if (settings.console.scope !== undefined) this._ctx.settings.console.scope = settings.console.scope;
				if (settings.console.showScope !== undefined) this._ctx.settings.console.showScope = settings.console.showScope;
				if (settings.console.showOrigin !== undefined) this._ctx.settings.console.showOrigin = settings.console.showOrigin;
				if (settings.console.showLevel !== undefined) this._ctx.settings.console.showLevel = settings.console.showLevel;
				if (settings.console.showTS !== undefined) this._ctx.settings.console.showTS = settings.console.showTS;
				if (settings.console.showPhase !== undefined) this._ctx.settings.console.showPhase = settings.console.showPhase;
			}
		}
	}

	/**
	 * Setup default providers.
	 */
	private _setupProviders(): CoreProviders {
		const id = UlidIdProvider.create()
		const process = NodeProcessProvider.create()
		const fs = NodeFsProvider.create()
		const datetime = NodeDatetimeProvider.create()


		return {
			id,
			process,
			fs,
			datetime
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

		if (err instanceof CoreEventError) {
			console.error(err.message);
			process.exit(err.exitCode);
		}

		if (desc) console.error(desc);
		throw err;
		// CoreError.panic("unknownError", desc);


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
		const TChannels extends CoreEventsChannelsShape,
		const TStages extends CoreStagesShape,
		const TGlobals extends CoreGlobalsShape,
		const TModules extends CoreModulesShape,
		const TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		options?: CLIOptions<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
	): CLI<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {

		try {

			const instance = new CLI({
				meta: options?.meta,
				settings: options?.settings,
				translations: buildTranslations(options?.translations),
				events: buildEvents(options?.events),
				channels: buildChannels(options?.channels),
				stages: buildStages(options?.stages),
				globals: buildGlobals(options?.globals),
				modules: buildModules(options?.modules),
				app: options?.app || {} as TApp
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
	public hooks(): Readonly<ApiService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>> {
		return this._ctx.api.devapi;
	}

	/**
	 * Expose the full internal context.
	 *
	 * This remains a low-level surface intended mostly for internal work and
	 * advanced debugging; the stable developer-facing API is `hooks()`.
	 */
	public ctx(): Readonly<Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>> {
		return this._ctx;
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
