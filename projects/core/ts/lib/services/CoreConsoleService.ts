import { Service } from "@abstracts";
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
	RuntimeCoreEvent
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
 *   - Displayed with code + optional label + details
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
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends Service<
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Minimum event level required for display.
	 */
	private _displayLevel: CoreEventLevel;

	/**
	 * Constructor.
	 *
	 * Registers this service as a system listener for all events ("*").
	 *
	 * @param ctx - Global execution context
	 */
	constructor(protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		super(ctx);
		this.print = this.print.bind(this);
		this.ctx.events.registerSystemListener("*", { handler: this.print, channel: "default" });
		this._displayLevel = CoreEventLevel[this.ctx.settings.coreConsoleLevel!];
	}

	/**
	 * Format timestamp using DatetimeProvider.
	 */
	private _formatTimestamp(ts: number): string {
		return this.ctx.providers.datetime.format(ts);
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
	 * [time] LEVEL PHASE (optional code)
	 */
	private _formatBase(event: RuntimeCoreEvent<string>, withCode?: boolean): string {
		const time = this._formatTimestamp(event.ts);
		const level = this._pad(CoreEventLevel[event.level].toUpperCase(), 7);
		const phase = this._pad(CoreEventPhase[event.phase].toUpperCase(), 10);

		if (withCode && withCode === true) return `[${time}] ${level} ${phase} ${event.code}`;
		return `[${time}] ${level} ${phase}`
	}

	/**
	 * Format signal event.
	 *
	 * Includes:
	 * - event code
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
			return `${base} ${msg.content}`;
		}

		if (msg.description && msg.description.trim() !== "") return `${base} ${msg.title}\n→ ${msg.description}`;
		return `${base} ${msg.title}`
	}

	/**
	 * Dispatch signal printing based on level.
	 */
	private async _printSignal(event: RuntimeCoreEvent<string>) {

		switch (event.level) {
			case CoreEventLevel.trace:
				this._printSignalTrace(event);
				break;
			case CoreEventLevel.debug:
				this._printSignalDebug(event);
				break;
			case CoreEventLevel.info:
				this._printSignalInfo(event);
				break;
			case CoreEventLevel.warning:
				this._printSignalWarning(event);
				break;
			case CoreEventLevel.error:
				this._printSignalError(event);
				break;
			case CoreEventLevel.fatal:
				this._printSignalFatal(event);
				break;
			default:
				return
		}
	}

	/**
	 * Dispatch message printing based on level.
	 *
	 * Performs translation before formatting.
	 */
	private async _printMessage(event: RuntimeCoreEvent<string>) {
		if (event.kind !== CoreEventKind.message) return;

		const msg = await this.ctx.i18n.tr(event.code, event.values);

		switch (event.level) {
			case CoreEventLevel.trace:
				this._printMessageTrace(event, msg);
				break;
			case CoreEventLevel.debug:
				this._printMessageDebug(event, msg);
				break;
			case CoreEventLevel.info:
				this._printMessageInfo(event, msg);
				break;
			case CoreEventLevel.warning:
				this._printMessageWarning(event, msg);
				break;
			case CoreEventLevel.error:
				this._printMessageError(event, msg);
				break;
			case CoreEventLevel.fatal:
				this._printMessageFatal(event, msg);
				break;
			default:
				return;
		}
	}

	// -----------------------------------------------------
	// SIGNAL PRINT METHODS
	// -----------------------------------------------------

	private _printSignalTrace(event: RuntimeCoreEvent<string>) {
		console.debug(this._formatSignal(event));
	}

	private _printSignalDebug(event: RuntimeCoreEvent<string>) {
		console.debug(this._formatSignal(event));
	}

	private _printSignalInfo(event: RuntimeCoreEvent<string>) {
		console.info(this._formatSignal(event));
	}

	private _printSignalWarning(event: RuntimeCoreEvent<string>) {
		console.warn(`\x1b[33m${this._formatSignal(event)}\x1b[0m`);
	}

	private _printSignalError(event: RuntimeCoreEvent<string>) {
		console.error(`\x1b[31m${this._formatSignal(event)}\x1b[0m`);
	}

	private _printSignalFatal(event: RuntimeCoreEvent<string>) {
		console.error(`\x1b[41m\x1b[37m${this._formatSignal(event)}\x1b[0m`);
	}

	// -----------------------------------------------------
	// MESSAGE PRINT METHODS
	// -----------------------------------------------------

	private _printMessageTrace(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.debug(this._formatMessage(event, msg));
	}

	private _printMessageDebug(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.debug(this._formatMessage(event, msg));
	}

	private _printMessageInfo(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.info(this._formatMessage(event, msg));
	}

	private _printMessageWarning(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.warn(`\x1b[33m${this._formatMessage(event, msg)}\x1b[0m`);
	}

	private _printMessageError(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.error(`\x1b[31m${this._formatMessage(event, msg)}\x1b[0m`);
	}

	private _printMessageFatal(event: RuntimeCoreEvent<string>, msg: CoreMessage<string>) {
		console.error(`\x1b[41m\x1b[37m${this._formatMessage(event, msg)}\x1b[0m`);
	}

	/**
	 * Raw output method (reserved for future use).
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
	public async print(event: RuntimeCoreEvent<string>) {
		if (!event) {
			return;
		}

		if (event.level < this._displayLevel) {
			return;
		}

		if (event.kind === CoreEventKind.signal) {
			await this._printSignal(event);
			return;
		} else if (event.kind === CoreEventKind.message) {
			await this._printMessage(event);
			return;
		}
	}
}
