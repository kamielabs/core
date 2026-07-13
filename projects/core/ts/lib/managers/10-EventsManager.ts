import { EventsManagerContext } from "@contexts";
import { BUILTIN_EVENTS, BuiltinEvents, FinalEvents, FinalEventsChannels } from "@data";
import { CoreEventError } from "@helpers";
import {
	CoreEvent,
	CoreEventKind,
	CoreEventKindLabel,
	CoreEventLevel,
	CoreEventLevelLabel,
	CoreEventOrigin,
	CoreEventPhase,
	CoreEventPhaseLabel,
	CoreEventsChannelsShape,
	CoreEventScope,
	CoreEventsShape,
	CoreEventsShapeDecl,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	EmitOptionsForEvent,
	EmitOptionsForKey,
	EventDictKey,
	EventFlowListener,
	EventKeysByKindAndLevel,
	EventKeysByLevel,
	EventListener,
	EventOutputListener,
	EventOutputListenerContext,
	EventSelector,
	LiveCoreEventsDict,
	RuntimeAppShape,
	RuntimeCoreEvent,
	RuntimeCoreMessageEvent,
	RuntimeCoreSignalEvent,
	TerminalEventKeys,
	TerminalMessageKeys,
	TerminalSignalKeys,
} from "@types";

// TODO: V0.1: Polish the entire class: remove the builtins hook methods for old builtin stages and their caller method
// TODO: V0.1: ! Careful ! this class is complex it stores the full event capacity system with listeners, auto exec, auto quit on error/fatal
// TODO: V0.1: Review the full class and deps for validating v0.1

/**
 * EventsManager (internal layer)
 *
 * Core responsibilities:
 * - Store and index runtime events
 * - Manage listeners (system / flow / runtime)
 * - Provide low-level primitives for event dispatching
 * - Enforce core event semantics (message/signal, terminal levels, flow triggers)
 *
 * Architecture:
 * - Event definitions (dict) are immutable
 * - Runtime state (live) is mutable and indexed
 * - Events are active runtime primitives, not passive logs
 *
 * Listener layers:
 * - system   → passive core-owned listeners registered by default
 * - flow     → runtime orchestration listeners used by FED engines
 * - runtime  → passive developer listeners registered at runtime
 *
 * Event model:
 * - `signal` events carry raw `details` and do not require i18n
 * - `message` events carry `values` and are i18n-capable
 * - `trace` / `debug` / `info` / `warning` are informative or observability-oriented
 * - `error` / `fatal` are terminal and stop script execution after dispatch
 * - `trigger: true` enables flow dispatch only when the selected engine is `fed`
 * - terminal events are never used as flow-control events
 *
 * Wildcard strategy:
 * - "*" listeners stored separately for performance
 *
 * Channel strategy:
 * - passive listeners may be grouped by channel
 * - runtime listeners override system listeners on the same channel
 * - this allows developer outputs to replace builtin outputs without mutating core wiring
 *
 * WARNING:
 * - This is a critical core component
 * - Must remain deterministic and side-effect controlled
 */
export class EventsManager<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private readonly _ctx: EventsManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	private _events: CoreEventsShapeDecl<TEvents>;
	private _channels: FinalEventsChannels<TChannels>;
	private _live: LiveCoreEventsDict;

	/**
	 * Listener stores by event.name
	 */
	private _systemListeners: Map<string, EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]> = new Map();
	private _flowListeners: Map<string, EventFlowListener[]> = new Map();
	private _runtimeListeners: Map<string, EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]> = new Map();

	/**
	 * Wildcard listeners ("*")
	 */
	private _systemWildcardListeners: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[] = [];
	private _flowWildcardListeners: EventFlowListener[] = [];
	private _runtimeWildcardListeners: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[] = [];

	/**
	 * Initialize EventsManager
	 *
	 * - Injects event dictionary (builtins + custom)
	 * - Initializes runtime storage and indexes
	 * - Freezes event definitions
	 */
	private constructor(
		ctx: EventsManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		events: CoreEventsShapeDecl<TEvents>,
		channels: FinalEventsChannels<TChannels>
	) {
		this._ctx = ctx;
		this._events = events;
		this._channels = channels;
		this._live = {
			list: [],
			byId: {},
			index: {
				byKind: {},
				byLevel: {},
				byPhase: {}
			}
		} satisfies LiveCoreEventsDict;
		this.init();
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
		ctx: EventsManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		events: CoreEventsShapeDecl<TEvents>,
		channels: FinalEventsChannels<TChannels>
	): EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new EventsManager(ctx, events, channels);
	}

	// This init is not async because it has to be executed during constructor phase
	/**
	 * Finalize manager initialization.
	 *
	 * Event definitions are frozen immediately because the core event registry is
	 * part of the runtime truth consumed by every other manager.
	 */
	private init() {
		this._freezeEvents();
	}

	/**
	 * Freeze the final event dictionary once the manager is constructed.
	 */
	private _freezeEvents() {
		this._events = this._ctx.helpers.core.deepFreeze(this._events);
	}

	public getDict(): CoreEventsShapeDecl<TEvents> {
		return this._events;
	}

	public getChannels(): FinalEventsChannels<TChannels> {
		return this._channels;
	}

	public getEvents(): FinalEvents<TEvents> {
		return this._events.list;
	}

	public getLive(): Readonly<LiveCoreEventsDict> {
		const live = this._ctx.helpers.core.deepClone(this._live);
		this._ctx.helpers.core.deepFreeze(live);
		return live;
	}

	/**
	 * Index event into lookup structures
	 */
	private _index<Name extends string>(
		event: RuntimeCoreEvent<Name>,
		state: LiveCoreEventsDict
	) {
		this._push(state.index.byKind, event.kind, event);
		this._push(state.index.byPhase, event.phase, event);
		this._push(state.index.byLevel, event.level, event);
	}

	/**
	 * Push event ID into index bucket
	 */
	private _push<K extends CoreEventKind | CoreEventLevel | CoreEventPhase, Name extends string>(
		map: Partial<Record<K, string[]>>,
		key: K,
		event: RuntimeCoreEvent<Name>
	) {
		map[key] ??= [];
		map[key].push(event.id);
	}

	/**
	 * Resolve event IDs into runtime events
	 */
	private _resolveIds(ids: string[]): RuntimeCoreEvent<string>[] {
		const byId = this.getLive().byId;
		const out: RuntimeCoreEvent<string>[] = [];

		for (const id of ids) {
			const e = byId[id];
			if (e) out.push(e);
		}

		return out;
	}

	/**
	 * Create and register runtime event
	 */
	private _createEvent<
		Name extends string,
	>(payload: CoreEvent<Name>): RuntimeCoreEvent<Name> {

		const isBuiltin = Object.values(BUILTIN_EVENTS).some(
			(evt) => payload.name === evt.name,
		);
		const event: RuntimeCoreEvent<Name> = {
			id: this._ctx.providers.id.generate(),
			ts: Date.now(),
			origin: isBuiltin ? CoreEventOrigin.core : CoreEventOrigin.app,
			...payload
		};

		this._live.list.push(event);
		this._live.byId[event.id] = event;
		this._index(event, this._live);

		return event;
	}

	/**
	 * Get event IDs by kind
	 */
	private _getIdsByKind(kind: CoreEventKind): string[] {
		return this.getLive().index.byKind[kind] ?? [];
	}

	/**
	 * Get event IDs by phase
	 */
	private _getIdsByPhase(phase: CoreEventPhase): string[] {
		return this.getLive().index.byPhase[phase] ?? [];
	}

	/**
	 * Get event IDs by level
	 */
	private _getIdsByLevel(level: CoreEventLevel): string[] {
		return this.getLive().index.byLevel[level] ?? [];
	}

	private _intersectIds(current: string[] | null, next: string[]): string[] {
		if (current === null) {
			return [...next];
		}

		const nextSet = new Set(next);

		return current.filter((id) => {
			return nextSet.has(id);
		});
	}

	public getFilteredEvents({
		kind = null,
		phase = null,
		level = null,
		nameContains = null
	}: {
		kind?: keyof typeof CoreEventKindLabel | null;
		phase?: keyof typeof CoreEventPhaseLabel | null;
		level?: keyof typeof CoreEventLevelLabel | null;
		nameContains?: string | null;
	} = {}): RuntimeCoreEvent<string>[] {

		let ids: string[] | null = null;

		const kindKey = kind ? CoreEventKindLabel[kind] : null;
		const phaseKey = phase ? CoreEventPhaseLabel[phase] : null;
		const levelKey = level ? CoreEventLevelLabel[level] : null;

		// Filter by kind
		if (kindKey !== null) {
			ids = this._intersectIds(
				ids,
				this._getIdsByKind(kindKey)
			);
		}

		if (phaseKey !== null) {
			ids = this._intersectIds(
				ids,
				this._getIdsByPhase(phaseKey)
			);
		}

		if (levelKey !== null) {
			ids = this._intersectIds(
				ids,
				this._getIdsByLevel(levelKey)
			);
		}

		let events = ids === null
			? [...this.getLive().list]
			: this._resolveIds(ids);

		if (nameContains !== null) {
			events = events.filter((event) => {
				return event.name.includes(nameContains);
			});
		}

		return events;
	}
	/**
	 * Resolve a public selector to a concrete runtime event name.
	 *
	 * `*` is preserved as a wildcard sentinel and therefore resolves to `null`.
	 */
	private _selectorToName(
		key: EventSelector<TEvents>
	): string | null {
		if (key === "*") return null;

		const evt = this.getEvents()[key];
		return evt?.name ?? null;
	}

	/**
	 * Register listener against a resolved event name or wildcard bucket.
	 *
	 * The listener family is preserved through the generic parameter so flow and
	 * passive output listeners never get mixed in internal stores.
	 */
	private _registerResolvedListener<T extends EventListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>>(
		store: Map<string, T[]>,
		wildcardStore: T[],
		name: string | null,
		handler: T
	) {
		if (name === null) {
			wildcardStore.push(handler);
			return;
		}

		if (!store.has(name)) {
			store.set(name, []);
		}

		store.get(name)!.push(handler);
	}

	/**
	 * Remove listener from a resolved event name or wildcard bucket.
	 *
	 * The listener family is preserved through the generic parameter so removal
	 * stays aligned with the corresponding internal store.
	 */
	private _offResolvedListener<T extends EventListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>>(
		store: Map<string, T[]>,
		wildcardStore: T[],
		name: string | null,
		handler: T
	) {
		if (name === null) {
			const index = wildcardStore.indexOf(handler);
			if (index !== -1) wildcardStore.splice(index, 1);
			return;
		}

		const list = store.get(name);
		if (!list) return;

		const index = list.indexOf(handler);
		if (index !== -1) {
			list.splice(index, 1);
		}
	}

	/**
	 * Register one-time listener
	 *
	 * The listener unregisters itself on first execution while preserving the
	 * original listener shape, including channel binding for passive output
	 * listeners when one exists.
	 */
	private _onceResolvedListener<Listener extends EventListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>>(
		register: (name: string | null, handler: Listener) => void,
		off: (name: string | null, handler: Listener) => void,
		name: string | null,
		handler: Listener
	) {
		const outputListenerCtx = { translate: this._ctx.i18n.tr.bind(this._ctx.i18n) }
		const wrapper: Listener = {
			handler: async (event: RuntimeCoreEvent<string>) => {
				off(name, wrapper);
				await handler.handler(event, outputListenerCtx);
			},
			...(("channel" in handler && handler.channel !== undefined)
				? { channel: handler.channel }
				: {})
		} as Listener;
		register(name, wrapper);
	}

	/**
	 * Register system listener
	 */
	private _registerSystemResolvedListener(name: string | null, handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._registerResolvedListener(
			this._systemListeners,
			this._systemWildcardListeners,
			name,
			handler
		);
	}

	/**
	 * Register flow listener
	 */
	private _registerFlowResolvedListener(name: string | null, handler: EventFlowListener) {
		this._registerResolvedListener(
			this._flowListeners,
			this._flowWildcardListeners,
			name,
			handler
		);
	}

	/**
	 * Register runtime listener
	 */
	private _registerRuntimeResolvedListener(name: string | null, handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._registerResolvedListener(
			this._runtimeListeners,
			this._runtimeWildcardListeners,
			name,
			handler
		);
	}

	/**
	 * Remove system listener
	 */
	private _offSystemResolvedListener(name: string | null, handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._offResolvedListener(
			this._systemListeners,
			this._systemWildcardListeners,
			name,
			handler
		);
	}

	/**
	 * Remove flow listener
	 */
	private _offFlowResolvedListener(name: string | null, handler: EventFlowListener) {
		this._offResolvedListener(
			this._flowListeners,
			this._flowWildcardListeners,
			name,
			handler
		);
	}

	/**
	 * Remove runtime listener
	 */
	private _offRuntimeResolvedListener(name: string | null, handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
		this._offResolvedListener(
			this._runtimeListeners,
			this._runtimeWildcardListeners,
			name,
			handler
		);
	}
	/**
	 * Register a system-level listener
	 *
	 * Used internally by the core.
	 * Supports:
	 * - specific event keys
	 * - "*" wildcard
	 */
	public registerSystemListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public registerSystemListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public registerSystemListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._registerSystemResolvedListener(name, handler);
	}

	/**
	 * Register a flow-level listener
	 *
	 * Used by FED engines to orchestrate runtime lifecycle from events carrying
	 * `trigger: true`.
	 */
	public registerFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventFlowListener
	): void;
	public registerFlowListener(
		key: "*",
		handler: EventFlowListener
	): void;
	public registerFlowListener(
		key: EventSelector<TEvents>,
		handler: EventFlowListener
	): void {
		const name = this._selectorToName(key);
		this._registerFlowResolvedListener(name, handler);
	}

	/**
	 * Register a runtime-level listener
	 *
	 * Used by developer layer (ToolsService).
	 */
	public registerRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public registerRuntimeListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public registerRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._registerRuntimeResolvedListener(name, handler);
	}

	/**
	 * Remove system-level listener
	 */
	public offSystemListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public offSystemListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public offSystemListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._offSystemResolvedListener(name, handler);
	}

	/**
	 * Remove flow-level listener
	 */
	public offFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventFlowListener
	): void;
	public offFlowListener(
		key: "*",
		handler: EventFlowListener
	): void;
	public offFlowListener(
		key: EventSelector<TEvents>,
		handler: EventFlowListener
	): void {
		const name = this._selectorToName(key);
		this._offFlowResolvedListener(name, handler);
	}

	/**
	 * Remove runtime-level listener
	 */
	public offRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public offRuntimeListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public offRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._offRuntimeResolvedListener(name, handler);
	}

	/**
	 * Register a one-time system listener
	 */
	public onceSystemListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public onceSystemListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public onceSystemListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._onceResolvedListener(
			this._registerSystemResolvedListener.bind(this),
			this._offSystemResolvedListener.bind(this),
			name,
			handler
		);
	}

	/**
	 * Register a runtime output listener (Tools API)
	 *
	 * Allows:
	 * - custom logging
	 * - event stream interception
	 *
	 * Default behavior:
	 * - listens to all events ("*")
	 * - channel = "default"
	 * - overrides any system listener registered on the same channel
	 */
	public setOutputListener(
		handler: (
			event: RuntimeCoreEvent<string>,
			ctx: EventOutputListenerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
		) => string | Promise<string | undefined>,
		channel: string = "default",
		eventKeys?: EventSelector<TEvents>[] | "*"
	) {
		const listener: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> = {
			handler,
			channel
		};

		const keys = eventKeys && eventKeys.length > 0 ? eventKeys : ["*"];

		for (const key of keys) {
			this.registerRuntimeListener(key as any, listener);
		}
	}

	/**
	 * Register a one-time flow listener
	 */
	public onceFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventFlowListener
	): void;
	public onceFlowListener(
		key: "*",
		handler: EventFlowListener
	): void;
	public onceFlowListener(
		key: EventSelector<TEvents>,
		handler: EventFlowListener
	): void {
		const name = this._selectorToName(key);
		this._onceResolvedListener<EventFlowListener>(
			this._registerFlowResolvedListener.bind(this),
			this._offFlowResolvedListener.bind(this),
			name,
			handler
		);
	}

	/**
	 * Register a one-time runtime listener
	 */
	public onceRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public onceRuntimeListener(
		key: "*",
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void;
	public onceRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): void {
		const name = this._selectorToName(key);
		this._onceResolvedListener(
			this._registerRuntimeResolvedListener.bind(this),
			this._offRuntimeResolvedListener.bind(this),
			name,
			handler
		);
	}

	/**
	 * Resolve handlers for an event
	 *
	 * Returns:
	 * - specific handlers (event.name)
	 * - wildcard handlers ("*")
	 *
	 * The listener family is preserved through the generic parameter so callers
	 * receive either flow listeners or passive output listeners, never a mixed set.
	 */
	private _getHandlersForEvent<Listener extends EventListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>>(
		runtimeEvent: RuntimeCoreEvent<string>,
		store: Map<string, Listener[]>,
		wildcardStore: Listener[]
	): Listener[] {
		const handlers = store.get(runtimeEvent.name) ?? [];
		return [...handlers, ...wildcardStore];
	}

	/**
	 * Dispatch event with channel priority
	 *
	 * Rules:
	 * - Handlers grouped by channel
	 * - Runtime handlers override system handlers per channel
	 * - Flow listeners are excluded from this passive dispatch path
	 */
	private async _dispatchWithChannels(
		runtimeEvent: RuntimeCoreEvent<string>,
	) {
		const systemHandlers = this._getHandlersForEvent(
			runtimeEvent,
			this._systemListeners,
			this._systemWildcardListeners,
		);

		const runtimeHandlers = this._getHandlersForEvent(
			runtimeEvent,
			this._runtimeListeners,
			this._runtimeWildcardListeners,
		);

		const systemByChannel = new Map<
			keyof FinalEventsChannels<TChannels> & string,
			EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]
		>();

		const runtimeByChannel = new Map<
			keyof FinalEventsChannels<TChannels> & string,
			EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]
		>();

		const group = (
			handlers: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[],
			target: typeof systemByChannel,
		) => {
			for (const listener of handlers) {
				const channel = listener.channel ?? "default";

				if (!target.has(channel)) {
					target.set(channel, []);
				}

				target.get(channel)!.push(listener);
			}
		};

		group(systemHandlers, systemByChannel);
		group(runtimeHandlers, runtimeByChannel);

		const outputListenerCtx = {
			translate: this._ctx.i18n.tr.bind(this._ctx.i18n),
		};

		for (const channel of Object.keys(this._channels) as Array<
			keyof FinalEventsChannels<TChannels> & string
		>) {

			const listeners =
				runtimeByChannel.get(channel) ??
				systemByChannel.get(channel);

			if (!listeners?.length) {
				continue;
			}

			for (const listener of listeners) {

				const minLevel =
					listener.level ?? CoreEventLevel.trace;

				const scope =
					listener.scope ?? CoreEventScope.app;

				if (runtimeEvent.level < minLevel) {
					continue;
				}

				if (runtimeEvent.scope < scope) {
					continue;
				}

				const output = await listener.handler(
					runtimeEvent,
					outputListenerCtx,
				);

				this._printRuntimeEvent(runtimeEvent, output);
			}
		}
	}
	// private async _dispatchWithChannels(
	// 	runtimeEvent: RuntimeCoreEvent<string>
	// ) {
	// 	const systemHandlers = this._getHandlersForEvent(
	// 		runtimeEvent,
	// 		this._systemListeners,
	// 		this._systemWildcardListeners
	// 	);
	//
	// 	const runtimeHandlers = this._getHandlersForEvent(
	// 		runtimeEvent,
	// 		this._runtimeListeners,
	// 		this._runtimeWildcardListeners
	// 	);
	//
	// 	const systemByChannel = new Map<string, EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]>();
	// 	const runtimeByChannel = new Map<string, EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]>();
	//
	// 	const group = (
	// 		handlers: EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[],
	// 		target: Map<string, EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>[]>
	// 	) => {
	// 		for (const h of handlers) {
	// 			const channel = h.channel ?? "default";
	// 			if (!target.has(channel)) target.set(channel, []);
	// 			target.get(channel)!.push(h);
	// 		}
	// 	};
	//
	// 	group(systemHandlers, systemByChannel);
	// 	group(runtimeHandlers, runtimeByChannel);
	//
	// 	const channels = new Set([
	// 		...systemByChannel.keys(),
	// 		...runtimeByChannel.keys()
	// 	]);
	//
	// 	const outputListenerCtx = { translate: this._ctx.i18n.tr.bind(this._ctx.i18n) };
	// 	for (const channel of channels) {
	// 		const runtime = runtimeByChannel.get(channel);
	// 		if (runtime && runtime.length > 0) {
	// 			for (const h of runtime) {
	// 				const output = await h.handler(runtimeEvent, outputListenerCtx);
	// 				this._printRuntimeEvent(runtimeEvent, output)
	// 			}
	// 		} else {
	// 			const system = systemByChannel.get(channel);
	// 			if (system) {
	// 				for (const h of system) {
	// 					const output = await h.handler(runtimeEvent, outputListenerCtx);
	// 					this._printRuntimeEvent(runtimeEvent, output)
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	/**
	 * Simple dispatch (no channel logic)
	 *
	 * Used for flow listeners only.
	 *
	 * Unlike passive listeners, flow listeners are not channelized because they
	 * participate in engine orchestration rather than output replacement.
	 */
	private async _dispatchListeners(
		runtimeEvent: RuntimeCoreEvent<string>,
		store: Map<string, EventFlowListener[]>,
		wildcardStore: EventFlowListener[]
	) {
		const handlers = store.get(runtimeEvent.name) ?? [];
		const allHandlers = [...handlers, ...wildcardStore];

		for (const handler of allHandlers) {
			await handler.handler(runtimeEvent);
		}
	}

	private _printRuntimeEvent(
		event: RuntimeCoreEvent<string>,
		output?: string
	): void | never {
		switch (event.level) {
			case CoreEventLevel.trace:
			case CoreEventLevel.debug:
				if (output !== undefined) {
					console.debug(output);
				}
				return;

			case CoreEventLevel.info:
				if (output !== undefined) {
					console.info(output);
				}
				return;

			case CoreEventLevel.warning:
				if (output !== undefined) {
					console.warn(output);
				}
				return;

			case CoreEventLevel.error:
			case CoreEventLevel.fatal:
				throw new CoreEventError(output ?? "", 1);
		}
	}

	/**
	 * Core emit pipeline
	 *
	 * Steps:
	 * 1. Create runtime event
	 * 2. Inject payload (details / values)
	 * 3. Dispatch passive listeners with channel override semantics
	 * 4. Dispatch flow listeners only when engine is `fed` and `trigger === true`
	 * 5. Handle terminal events
	 *
	 * Terminal rule:
	 * - `error` and `fatal` never participate in flow dispatch
	 */
	private async _emit<K extends keyof FinalEvents<TEvents>>(
		key: K,
		options?: EmitOptionsForKey<FinalEvents<TEvents>, K>
	): Promise<RuntimeCoreEvent<string> | undefined> | never {


		const evt = this.getEvents()[key];
		if (!evt) this.throw('runtimeMissingEvent', {
			details: [`Unknown key: ${key as string}`]
		});

		const runtimeEvent = this._createEvent(evt);

		if (evt.kind === CoreEventKind.signal) {
			if (options && "details" in options) {
				(runtimeEvent as RuntimeCoreSignalEvent<TEvents[K]["name"]>).details = options.details;
			}
		}

		if (evt.kind === CoreEventKind.message) {
			if (options && "values" in options) {
				(runtimeEvent as RuntimeCoreMessageEvent<TEvents[K]["name"]>).values = options.values;
			}
		}

		await this._dispatchWithChannels(runtimeEvent);

		if (this._ctx.settings.engine === "fed" && evt.trigger === true) {
			await this._dispatchListeners(
				runtimeEvent,
				this._flowListeners,
				this._flowWildcardListeners
			);
		}

		return runtimeEvent;

	}

	/**
	 * Emit builtin non-terminal events reserved for the core.
	 */
	public async emit<
		K extends EventKeysByLevel<BuiltinEvents, CoreEventLevel.trace | CoreEventLevel.debug | CoreEventLevel.info>
	>(
		key: K,
		options?: EmitOptionsForKey<BuiltinEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForKey<FinalEvents<TEvents>, K> | undefined);
	}
	public async warn<
		K extends EventKeysByLevel<BuiltinEvents, CoreEventLevel.warning>
	>(
		key: K,
		options?: EmitOptionsForKey<BuiltinEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForKey<FinalEvents<TEvents>, K> | undefined);
	}
	/**
	 * Emit builtin terminal event and terminate execution.
	 *
	 * The trailing `throw` is only a TypeScript `never` guard. Runtime
	 * termination is driven by the terminal event pipeline itself.
	 */
	public throw<
		K extends TerminalEventKeys<BuiltinEvents>
	>(
		key: K,
		options?: EmitOptionsForKey<BuiltinEvents, K>
	): never {
		return this._emit(key, options as EmitOptionsForKey<FinalEvents<TEvents>, K> | undefined) as never;
	}

	public signalThrow<
		K extends TerminalSignalKeys<TEvents>
	>(
		key: K,
		options?: EmitOptionsForEvent<TEvents[K]> | undefined
	): never {
		return this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined) as never;
	}
	public messageThrow<
		K extends TerminalMessageKeys<TEvents>
	>(
		key: K,
		options?: EmitOptionsForEvent<TEvents[K]> | undefined
	): never {
		return this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined) as never
	}

	/**
	 * Emit custom non-terminal signal events.
	 */
	public async signalTrace<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.signal, CoreEventLevel.trace>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async signalDebug<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.signal, CoreEventLevel.debug>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async signalInfo<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.signal, CoreEventLevel.info>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async signalWarn<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.signal, CoreEventLevel.warning>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}
	/**
	 * Emit custom non-terminal message events.
	 */
	public async messageTrace<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.message, CoreEventLevel.trace>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async messageDebug<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.message, CoreEventLevel.debug>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async messageInfo<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.message, CoreEventLevel.info>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	public async messageWarn<
		K extends EventKeysByKindAndLevel<TEvents, CoreEventKind.message, CoreEventLevel.warning>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return await this._emit(key, options as EmitOptionsForEvent<TEvents[K]> | undefined)
	}

	/**
	 * Get event by ID
	 */
	public get(id: string): RuntimeCoreEvent<string> | undefined {
		return this.getLive().byId[id];
	}

	/**
	 * Get all runtime events
	 */
	public getAll(): RuntimeCoreEvent<string>[] {
		return this.getLive().list;
	}

	/**
	 * Get events by kind
	 */
	public getEventsByKind(kind: keyof typeof CoreEventKindLabel): RuntimeCoreEvent<string>[] {
		return this._resolveIds(this._getIdsByKind(CoreEventKindLabel[kind]));
	}

	/**
	 * Get events by phase
	 */
	public getEventsByPhase(phase: keyof typeof CoreEventPhaseLabel): RuntimeCoreEvent<string>[] {
		return this._resolveIds(this._getIdsByPhase(CoreEventPhaseLabel[phase]));
	}

	/**
	 * Get events by level
	 */
	public getEventsByLevel(level: keyof typeof CoreEventLevelLabel): RuntimeCoreEvent<string>[] {
		return this._resolveIds(this._getIdsByLevel(CoreEventLevelLabel[level]));
	}
}
