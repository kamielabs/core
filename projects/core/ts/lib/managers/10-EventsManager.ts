import { LiveManagerWithDict } from "@abstracts";
import { Context } from "@contexts";
import { BuiltinEvents, FinalEvents } from "@data";
import {
	CoreEvent,
	CoreEventKind,
	CoreEventKindLabel,
	CoreEventLevel,
	CoreEventLevelLabel,
	CoreEventPhase,
	CoreEventPhaseLabel,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	EmitOptionsForKey,
	EventDictKey,
	EventListener,
	EventSelector,
	LiveCoreEventsDict,
	MessageEventKeys,
	RuntimeCoreEvent,
	RuntimeCoreMessageEvent,
	RuntimeCoreSignalEvent,
	SignalEventKeys
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
 *
 * Architecture:
 * - Event definitions (dict) are immutable
 * - Runtime state (live) is mutable and indexed
 *
 * Listener layers:
 * - system   → core internal logic
 * - flow     → lifecycle orchestration (FED engine)
 * - runtime  → user/dev hooks
 *
 * Wildcard strategy:
 * - "*" listeners stored separately for performance
 *
 * WARNING:
 * - This is a critical core component
 * - Must remain deterministic and side-effect controlled
 */
export class EventsManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends LiveManagerWithDict<
	FinalEvents<TEvents>,
	LiveCoreEventsDict,
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Listener stores by event.code
	 */
	private systemListeners: Map<string, EventListener[]> = new Map();
	private flowListeners: Map<string, EventListener[]> = new Map();
	private runtimeListeners: Map<string, EventListener[]> = new Map();

	/**
	 * Wildcard listeners ("*")
	 */
	private systemWildcardListeners: EventListener[] = [];
	private flowWildcardListeners: EventListener[] = [];
	private runtimeWildcardListeners: EventListener[] = [];

	/**
	 * Initialize EventsManager
	 *
	 * - Injects event dictionary (builtins + custom)
	 * - Initializes runtime storage and indexes
	 * - Freezes event definitions
	 */
	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		_events: FinalEvents<TEvents>
	) {
		super(
			ctx,
			_events,
			{
				list: [],
				byId: {},
				index: {
					byKind: {},
					byLevel: {},
					byPhase: {}
				}
			} satisfies LiveCoreEventsDict
		);
		this.freezeDict();
	}

	/**
	 * Index event into lookup structures
	 */
	private _index<Code extends string>(
		event: RuntimeCoreEvent<Code>,
		state: LiveCoreEventsDict
	) {
		this._push(state.index.byKind, event.kind, event);
		this._push(state.index.byPhase, event.phase, event);
		this._push(state.index.byLevel, event.level, event);
	}

	/**
	 * Push event ID into index bucket
	 */
	private _push<K extends CoreEventKind | CoreEventLevel | CoreEventPhase, Code extends string>(
		map: Partial<Record<K, string[]>>,
		key: K,
		event: RuntimeCoreEvent<Code>
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
	private _createEvent<Code extends string>(payload: CoreEvent<Code>): RuntimeCoreEvent<Code> {
		const event: RuntimeCoreEvent<Code> = {
			id: this.ctx.providers.id.create(),
			ts: Date.now(),
			...payload
		};

		this.getLive().list.push(event);
		this.getLive().byId[event.id] = event;
		this._index(event, this.getLive());

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

	/**
	 * Resolve selector to event code
	 */
	private _selectorToCode(
		key: EventSelector<TEvents>
	): string | null {
		if (key === "*") return null;

		const evt = this.getDict()[key];
		return evt?.code ?? null;
	}

	/**
	 * Register listener (resolved)
	 */
	private _registerResolvedListener(
		store: Map<string, EventListener[]>,
		wildcardStore: EventListener[],
		code: string | null,
		handler: EventListener
	) {
		if (code === null) {
			wildcardStore.push(handler);
			return;
		}

		if (!store.has(code)) {
			store.set(code, []);
		}

		store.get(code)!.push(handler);
	}

	/**
	 * Remove listener (resolved)
	 */
	private _offResolvedListener(
		store: Map<string, EventListener[]>,
		wildcardStore: EventListener[],
		code: string | null,
		handler: EventListener
	) {
		if (code === null) {
			const index = wildcardStore.indexOf(handler);
			if (index !== -1) wildcardStore.splice(index, 1);
			return;
		}

		const list = store.get(code);
		if (!list) return;

		const index = list.indexOf(handler);
		if (index !== -1) {
			list.splice(index, 1);
		}
	}

	/**
	 * Register one-time listener
	 */
	private _onceResolvedListener(
		register: (code: string | null, handler: EventListener) => void,
		off: (code: string | null, handler: EventListener) => void,
		code: string | null,
		handler: EventListener
	) {
		const wrapper: EventListener = {
			handler: async (event) => {
				off(code, wrapper);
				await handler.handler(event);
			},
			...(handler.channel !== undefined && { channel: handler.channel })
		}
		register(code, wrapper);
	}

	/**
	 * Register system listener
	 */
	private _registerSystemResolvedListener(code: string | null, handler: EventListener) {
		this._registerResolvedListener(
			this.systemListeners,
			this.systemWildcardListeners,
			code,
			handler
		);
	}

	/**
	 * Register flow listener
	 */
	private _registerFlowResolvedListener(code: string | null, handler: EventListener) {
		this._registerResolvedListener(
			this.flowListeners,
			this.flowWildcardListeners,
			code,
			handler
		);
	}

	/**
	 * Register runtime listener
	 */
	private _registerRuntimeResolvedListener(code: string | null, handler: EventListener) {
		this._registerResolvedListener(
			this.runtimeListeners,
			this.runtimeWildcardListeners,
			code,
			handler
		);
	}

	/**
	 * Remove system listener
	 */
	private _offSystemResolvedListener(code: string | null, handler: EventListener) {
		this._offResolvedListener(
			this.systemListeners,
			this.systemWildcardListeners,
			code,
			handler
		);
	}

	/**
	 * Remove flow listener
	 */
	private _offFlowResolvedListener(code: string | null, handler: EventListener) {
		this._offResolvedListener(
			this.flowListeners,
			this.flowWildcardListeners,
			code,
			handler
		);
	}

	/**
	 * Remove runtime listener
	 */
	private _offRuntimeResolvedListener(code: string | null, handler: EventListener) {
		this._offResolvedListener(
			this.runtimeListeners,
			this.runtimeWildcardListeners,
			code,
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
		handler: EventListener
	): void;
	public registerSystemListener(
		key: "*",
		handler: EventListener
	): void;
	public registerSystemListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._registerSystemResolvedListener(code, handler);
	}

	/**
	 * Register a flow-level listener
	 *
	 * Used by FED engine to orchestrate runtime lifecycle.
	 */
	public registerFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public registerFlowListener(
		key: "*",
		handler: EventListener
	): void;
	public registerFlowListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._registerFlowResolvedListener(code, handler);
	}

	/**
	 * Register a runtime-level listener
	 *
	 * Used by developer layer (ToolsService).
	 */
	public registerRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public registerRuntimeListener(
		key: "*",
		handler: EventListener
	): void;
	public registerRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._registerRuntimeResolvedListener(code, handler);
	}

	/**
	 * Remove system-level listener
	 */
	public offSystemListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public offSystemListener(
		key: "*",
		handler: EventListener
	): void;
	public offSystemListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._offSystemResolvedListener(code, handler);
	}

	/**
	 * Remove flow-level listener
	 */
	public offFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public offFlowListener(
		key: "*",
		handler: EventListener
	): void;
	public offFlowListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._offFlowResolvedListener(code, handler);
	}

	/**
	 * Remove runtime-level listener
	 */
	public offRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public offRuntimeListener(
		key: "*",
		handler: EventListener
	): void;
	public offRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._offRuntimeResolvedListener(code, handler);
	}

	/**
	 * Register a one-time system listener
	 */
	public onceSystemListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public onceSystemListener(
		key: "*",
		handler: EventListener
	): void;
	public onceSystemListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._onceResolvedListener(
			this._registerSystemResolvedListener.bind(this),
			this._offSystemResolvedListener.bind(this),
			code,
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
	 */
	public setOutputListener(
		handler: (event: RuntimeCoreEvent<string>) => void | Promise<void>,
		channel: string = "default",
		eventKeys?: EventSelector<TEvents>[] | "*"
	) {
		const listener: EventListener = {
			handler,
			channel
		};

		const keys = eventKeys && eventKeys.length > 0 ? eventKeys : ["*"];

		for (const key of keys) {
			this.ctx.events.registerRuntimeListener(key as any, listener);
		}
	}

	/**
	 * Register a one-time flow listener
	 */
	public onceFlowListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public onceFlowListener(
		key: "*",
		handler: EventListener
	): void;
	public onceFlowListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._onceResolvedListener(
			this._registerFlowResolvedListener.bind(this),
			this._offFlowResolvedListener.bind(this),
			code,
			handler
		);
	}

	/**
	 * Register a one-time runtime listener
	 */
	public onceRuntimeListener<K extends EventDictKey<TEvents>>(
		key: K,
		handler: EventListener
	): void;
	public onceRuntimeListener(
		key: "*",
		handler: EventListener
	): void;
	public onceRuntimeListener(
		key: EventSelector<TEvents>,
		handler: EventListener
	): void {
		const code = this._selectorToCode(key);
		this._onceResolvedListener(
			this._registerRuntimeResolvedListener.bind(this),
			this._offRuntimeResolvedListener.bind(this),
			code,
			handler
		);
	}

	/**
	 * Resolve handlers for an event
	 *
	 * Returns:
	 * - specific handlers (event.code)
	 * - wildcard handlers ("*")
	 */
	private _getHandlersForEvent(
		runtimeEvent: RuntimeCoreEvent<string>,
		store: Map<string, EventListener[]>,
		wildcardStore: EventListener[]
	): EventListener[] {
		const handlers = store.get(runtimeEvent.code) ?? [];
		return [...handlers, ...wildcardStore];
	}

	/**
	 * Dispatch event with channel priority
	 *
	 * Rules:
	 * - Handlers grouped by channel
	 * - Runtime handlers override system handlers per channel
	 */
	private async _dispatchWithChannels(
		runtimeEvent: RuntimeCoreEvent<string>
	) {
		const systemHandlers = this._getHandlersForEvent(
			runtimeEvent,
			this.systemListeners,
			this.systemWildcardListeners
		);

		const runtimeHandlers = this._getHandlersForEvent(
			runtimeEvent,
			this.runtimeListeners,
			this.runtimeWildcardListeners
		);

		const systemByChannel = new Map<string, EventListener[]>();
		const runtimeByChannel = new Map<string, EventListener[]>();

		const group = (handlers: EventListener[], target: Map<string, EventListener[]>) => {
			for (const h of handlers) {
				const channel = h.channel ?? "default";
				if (!target.has(channel)) target.set(channel, []);
				target.get(channel)!.push(h);
			}
		};

		group(systemHandlers, systemByChannel);
		group(runtimeHandlers, runtimeByChannel);

		const channels = new Set([
			...systemByChannel.keys(),
			...runtimeByChannel.keys()
		]);

		for (const channel of channels) {
			const runtime = runtimeByChannel.get(channel);
			if (runtime && runtime.length > 0) {
				for (const h of runtime) {
					await h.handler(runtimeEvent);
				}
			} else {
				const system = systemByChannel.get(channel);
				if (system) {
					for (const h of system) {
						await h.handler(runtimeEvent);
					}
				}
			}
		}
	}

	/**
	 * Simple dispatch (no channel logic)
	 *
	 * Used for flow listeners (FED engine)
	 */
	private async _dispatchListeners(
		runtimeEvent: RuntimeCoreEvent<string>,
		store: Map<string, EventListener[]>,
		wildcardStore: EventListener[]
	) {
		const handlers = store.get(runtimeEvent.code) ?? [];
		const allHandlers = [...handlers, ...wildcardStore];

		for (const handler of allHandlers) {
			await handler.handler(runtimeEvent);
		}
	}

	/**
	 * Handle terminal events
	 *
	 * error / fatal → process.exit(1)
	 */
	private _handleTerminalEvent(runtimeEvent: RuntimeCoreEvent<string>): never | void {
		if (runtimeEvent.level === CoreEventLevel.fatal) {
			process.exit(1);
		}

		if (runtimeEvent.level === CoreEventLevel.error) {
			process.exit(1);
		}
	}

	/**
	 * Core emit pipeline
	 *
	 * Steps:
	 * 1. Create runtime event
	 * 2. Inject payload (details / values)
	 * 3. Dispatch system + runtime
	 * 4. Dispatch flow (FED engine only)
	 * 5. Handle terminal events
	 */
	private async _emit<K extends keyof TEvents>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	): Promise<RuntimeCoreEvent<TEvents[K]["code"]> | undefined> {

		const evt = this.getDict()[key];
		if (!evt) return;

		const runtimeEvent = this._createEvent(evt);

		if (evt.kind === CoreEventKind.signal) {
			if (options && "details" in options) {
				(runtimeEvent as RuntimeCoreSignalEvent<TEvents[K]["code"]>).details = options.details;
			}
		}

		if (evt.kind === CoreEventKind.message) {
			if (options && "values" in options) {
				(runtimeEvent as RuntimeCoreMessageEvent<TEvents[K]["code"]>).values = options.values;
			}
		}

		await this._dispatchWithChannels(runtimeEvent);

		if (this.ctx.settings.engine === "fed" && evt.trigger === true) {
			await this._dispatchListeners(
				runtimeEvent,
				this.flowListeners,
				this.flowWildcardListeners
			);
		}

		this._handleTerminalEvent(runtimeEvent);

		return runtimeEvent;
	}

	/**
	 * Internal emit (builtins only)
	 */
	public async internalEmit<K extends keyof BuiltinEvents>(
		key: K,
		options?: EmitOptionsForKey<BuiltinEvents, K>
	): Promise<RuntimeCoreEvent<TEvents[K]["code"]> | undefined> {
		return this._emit(key, options as EmitOptionsForKey<TEvents, K> | undefined);
	}

	/**
	 * Emit signal event (developer-facing)
	 */
	public async emitSignal<
		K extends SignalEventKeys<TEvents>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return this._emit(key, options);
	}

	/**
	 * Emit message event (developer-facing)
	 */
	public async emitMessage<
		K extends MessageEventKeys<TEvents>
	>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	) {
		return this._emit(key, options);
	}

	/**
	 * Generic emit method
	 *
	 * TODO: split into signal/message APIs
	 */
	public async emit<K extends keyof FinalEvents<TEvents>>(
		key: K,
		options?: EmitOptionsForKey<TEvents, K>
	): Promise<RuntimeCoreEvent<TEvents[K]["code"]> | undefined> {
		return this._emit(key, options);
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
