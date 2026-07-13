import { Context } from "@contexts";
import {
	CoreMessage,
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeCoreEvent,
	CoreConsoleSettings,
	CoreEventLevelLabel,
	RuntimeAppShape,
	EventOutputListenerContext,
	CoreEventOrigin,
	CoreEventScopeLabel,
	CoreEventScope,
	CoreEventsChannelsShape
} from "@types";

/**
 * TODO: V0.2: Improve signal formatting (better rendering of `details` array, spacing and structure)
 *
 * TODO: V0.2: Improve message formatting (better distinction between content-only vs title + description display)
 */

/**
 * CoreConsoleService
 *
 * Default system output service for core events.
 *
 * Responsibilities:
 * - Listen to all runtime events via EventsManager
 * - Format events (signals and messages) into human-readable output
 * - Route formatted output to console (stdout/stderr)
 * - Apply level-based filtering
 *
	 * Architectural role:
	 * - Acts as the default event consumer for the "default" channel
	 * - Registers itself as the built-in system listener for console output
	 * - Provides immediate feedback during runtime execution
 *
 * Event handling:
 * - Automatically registered as a system listener on "*"
 * - Receives all events emitted by the core
 * - Filters events based on configured display level
 *
 * Event types:
 * - signal:
 *   - Low-level, technical events
 *   - Displayed with name + optional label + details
 *
 * - message:
 *   - User-facing events
 *   - Translated via I18nManager before display
 *
 * Formatting:
 * - Base format: [time] LEVEL PHASE ...
 * - Timestamp via DatetimeProvider
 * - Level and phase are padded for alignment
 * - ANSI colors applied for warning/error/fatal levels
 *
 * Level filtering:
 * - Events below configured coreConsoleLevel are ignored
 *
 * Design principles:
 * - Stateless formatting (no event mutation)
 * - Separation between formatting and printing
 * - Delegation to providers (datetime)
 * - Minimal logic, focused on output only
 *
 * Usage:
 * - Automatically instantiated and registered in context
 * - Not intended for direct use by developers
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class CoreConsoleService<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private _ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	/**
	 * Minimum event level required for display.
	 */
	private _displayLevel: CoreEventLevel;
	private _displayScope: CoreEventScope;
	private _settings: CoreConsoleSettings;

	/**
	 * Constructor.
	 *
	 * Registers this service as a system listener for all events ("*").
	 *
	 * @param ctx - Global execution context
	 */
	private constructor(ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._ctx = ctx;

		this._settings = this._ctx.settings.console!;
		this._displayLevel = CoreEventLevelLabel[this._settings.level!]
		this._displayScope = CoreEventScopeLabel[this._settings.scope!]
		this._ctx.events.registerSystemListener("*", { handler: this.printEvent, channel: "default", level: this._displayLevel, scope: this._displayScope });
	}

	public static create<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): CoreConsoleService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new CoreConsoleService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>(ctx);
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	/**
	 * Format timestamp using DatetimeProvider.
	 */
	private _formatTimestamp(ts: number): string {
		return this._ctx.providers.datetime.format(ts);
	}

	/**
	 * Pad string to fixed size.
	 */
	private _pad(str: string, size: number): string {
		return str.padEnd(size, " ");
	}

	/**
	 * Format base event prefix.
	 *
	 * Format:
	 * [time] LEVEL PHASE (optional name)
	 */
	private _formatBase(event: RuntimeCoreEvent<string>, withName?: boolean): string {
		const time = this._settings.showTS ? `[${this._formatTimestamp(event.ts)}] ` : "";
		const origin = this._formatOrigin(event.origin);
		const scope = this._formatScope(event.scope);
		const level = this._settings.showLevel ? `${this._pad(CoreEventLevel[event.level].toUpperCase(), 7)} ` : "";
		const phase = this._settings.showPhase ? `${this._pad(CoreEventPhase[event.phase].toUpperCase(), 10)} ` : "";


		if (withName && withName === true) return `${time}${scope}${origin}${level}${phase}${event.name}`;
		return `${time}${scope}${origin}${level}${phase}`
	}
	private _formatOrigin(origin: CoreEventOrigin): string {
		if (!this._settings.showOrigin) {
			return "";
		}

		return `${this._pad(
			CoreEventOrigin[origin].toUpperCase(),
			5,
		)} `;
	}

	private _formatScope(scope: CoreEventScope): string {
		if (!this._settings.showScope) {
			return "";
		}

		return `${this._pad(
			CoreEventScope[scope].toUpperCase(),
			5,
		)} `;
	}
	/**
	 * Format signal event.
	 *
	 * Includes:
	 * - event name
	 * - optional label
	 * - optional details array
	 */
	private _formatSignal(event: RuntimeCoreEvent<string>) {
		if (event.kind !== CoreEventKind.signal) return;
		let base = this._formatBase(event, true)

		if (event.label) {
			base += ` (${event.label})`
		}

		if (event.details?.length) {
			base += ` [${event.details.join(" ")}]`
		}

		return base
	}

	/**
	 * Format message event.
	 *
	 * Supports:
	 * - simple content messages
	 * - structured messages (title + description)
	 */
	private _formatMessage(
		event: RuntimeCoreEvent<string>,
		msg: CoreMessage<string>
	): string {
		const base = this._formatBase(event, false);

		if ("content" in msg) {
			const content = base === "" ? `${msg.content}` : `${base}${msg.content}`;
			return content;
		}

		let fullMessage = base === "" ? `${base} ` : "";
		fullMessage += msg.title;
		if (msg.description && msg.description.trim() !== "") {
			fullMessage += `\n→ ${msg.description}`;
			return fullMessage
		}

		return fullMessage;
	}

	/**
	 * Dispatch signal printing based on level.
	 */
	private async _printSignal(event: RuntimeCoreEvent<string>) {

		switch (event.level) {
			case CoreEventLevel.trace:
				return this._formatSignal(event);
			case CoreEventLevel.debug:
				return this._formatSignal(event);
			case CoreEventLevel.info:
				return this._formatSignal(event);
			case CoreEventLevel.warning:
				return `\x1b[33m${this._formatSignal(event)}\x1b[0m`;
			case CoreEventLevel.error:
				return `\x1b[31m${this._formatSignal(event)}\x1b[0m`;
			case CoreEventLevel.fatal:
				return `\x1b[41m\x1b[37m${this._formatSignal(event)}\x1b[0m`;
			default:
				return;
		}
	}

	/**
	 * Dispatch message printing based on level.
	 *
	 * Performs translation before formatting.
	 */
	private async _printMessage(
		event: RuntimeCoreEvent<string>,
		ctx: EventOutputListenerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): Promise<string | undefined> {
		if (event.kind !== CoreEventKind.message) return;

		const msg = await ctx.translate(event.name, event.values);

		switch (event.level) {
			case CoreEventLevel.trace:
				return this._formatMessage(event, msg);
			case CoreEventLevel.debug:
				return this._formatMessage(event, msg);
			case CoreEventLevel.info:
				return this._formatMessage(event, msg);
			case CoreEventLevel.warning:
				return `\x1b[33m${this._formatMessage(event, msg)}\x1b[0m`;
			case CoreEventLevel.error:
				return `\x1b[31m${this._formatMessage(event, msg)}\x1b[0m`;
			case CoreEventLevel.fatal:
				return `\x1b[41m\x1b[37m${this._formatMessage(event, msg)}\x1b[0m`;
			default:
				return;
		}
	}

	// private _shouldPrintScope(scope: CoreEventScope): boolean {
	// 	return scope >= this._displayScope;
	// }

	/**
	 * Raw output placeholder.
	 *
	 * Reserved for future extension and currently intentionally empty.
	 */
	public raw() { }

	/**
	 * Main event handler.
	 *
	 * Behavior:
	 * - Filters events by level
	 * - Dispatches to signal or message handlers
	 *
	 * @param event - Runtime event
	 */
	public printEvent: (
		event: RuntimeCoreEvent<string>,
		ctx: { translate: (name: string, values?: Record<string, string>) => Promise<CoreMessage<string>> }
	) => Promise<string | undefined> = async (event: RuntimeCoreEvent<string>, ctx) => {
		if (!event) {
			return;
		}
		// if (!this._shouldPrintScope(event.scope)) {
		// 	return;
		// }

		// if (event.level < this._displayLevel) {
		// 	return;
		// }

		if (event.kind === CoreEventKind.signal) {
			return await this._printSignal(event);
		} else if (event.kind === CoreEventKind.message) {
			return await this._printMessage(event, ctx);
		}
	}
}
