import { I18nTrMethod } from "@contexts";
import { FinalEvents, FinalEventsChannels } from "@data";
import { CoreStagesShape, CoreGlobalsShape, CoreModulesShape, CoreTranslationsShape, RuntimeAppShape } from "@types";

/**
 * Declarative event kind.
 *
 * - `signal` is a non-i18n event
 * - `message` is an i18n-capable event
 */
export enum CoreEventKind {
	signal,
	message
}

/**
 * Canonical lifecycle phase labels used by declarative and runtime events.
 */
export enum CoreEventPhase {
	declarative,
	bootstrap,
	stage,
	i18n,
	parser,
	globals,
	modules,
	single,
	runtime
}

/**
 * Ordered event severity / nature levels used across the core.
 *
 * `error` and `fatal` are terminal levels at runtime.
 */
export enum CoreEventLevel {
	trace,
	debug,
	info,
	warning,
	error,
	fatal
}

export enum CoreEventScope {
	core,
	app
}

export enum CoreEventOrigin {
	core,
	app
}

export type EventKindRecords = Record<string, CoreEventKind>;
export type EventPhaseRecords = Record<string, CoreEventPhase>;
export type EventLevelRecords = Record<string, CoreEventLevel>;
export type EventScopeRecords = Record<string, CoreEventScope>;
export type EventOriginRecords = Record<string, CoreEventOrigin>;

/**
 * String-to-enum lookup for event kinds.
 */
export const CoreEventKindLabel = {
	signal: CoreEventKind.signal,
	message: CoreEventKind.message,
} as const satisfies EventKindRecords;

/**
 * String-to-enum lookup for event phases.
 */
export const CoreEventPhaseLabel = {
	declarative: CoreEventPhase.declarative,
	bootstrap: CoreEventPhase.bootstrap,
	stage: CoreEventPhase.stage,
	i18n: CoreEventPhase.i18n,
	parser: CoreEventPhase.parser,
	globals: CoreEventPhase.globals,
	modules: CoreEventPhase.modules,
	single: CoreEventPhase.single,
	runtime: CoreEventPhase.runtime,
} as const satisfies EventPhaseRecords;

/**
 * String-to-enum lookup for event levels.
 */
export const CoreEventLevelLabel = {
	trace: CoreEventLevel.trace,
	debug: CoreEventLevel.debug,
	info: CoreEventLevel.info,
	warning: CoreEventLevel.warning,
	error: CoreEventLevel.error,
	fatal: CoreEventLevel.fatal,
} as const satisfies EventLevelRecords;

export const CoreEventScopeLabel = {
	core: CoreEventScope.core,
	app: CoreEventScope.app
} as const satisfies EventScopeRecords;

export const CoreEventOriginLabel = {
	core: CoreEventOrigin.core,
	app: CoreEventOrigin.app
} as const satisfies EventOriginRecords;

/* -------------------------------------------------------------------------- */
/* Declarative events                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Shared declarative event shape.
 *
 * This is the common base used by:
 * - built-in event dictionaries
 * - custom event declarations
 *
 * `label` is an optional human-oriented hint for signal rendering.
 * `trigger` marks events that may be consumed by FED flow listeners.
 */
export type CoreEventBase<
	Name extends string,
	Kind extends CoreEventKind,
	Level extends CoreEventLevel,
	Phase extends CoreEventPhase,
	Scope extends CoreEventScope
> = {
	name: Name;
	kind: Kind;
	level: Level;
	phase: Phase;
	scope: Scope;
	label?: string;
	trigger?: boolean;
};

/**
 * Important:
 * CoreEvent is intentionally NOT split into Signal | Message here.
 *
 * Signal/message specialization is handled by extraction helpers,
 * emit options and runtime event typing.
 */
export type CoreEvent<
	Name extends string,
> = CoreEventBase<Name, CoreEventKind, CoreEventLevel, CoreEventPhase, CoreEventScope>;

/**
 * Generic event dictionary shape.
 *
 * Keys are ergonomic programmatic aliases.
 * `event.name` remains the canonical runtime identifier.
 */
export type CoreEventsShape = {
	[Key: string]: CoreEvent<
		string
	>;
};

export type CoreEventsShapeDecl<TEvents extends CoreEventsShape> = {
	list: FinalEvents<TEvents>;
	indexes: {
		byName: Record<string, string>,
		byKind: Record<CoreEventKind, string[]>,
		byPhase: Record<CoreEventPhase, string[]>,
		byLevel: Record<CoreEventLevel, string[]>
	}
}


export type CoreEventsChannel = {
	description?: string;
}

export type CoreEventsChannelsShape = {
	[C in string]: CoreEventsChannel
}

/* -------------------------------------------------------------------------- */
/* Runtime events                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Runtime instance of a `signal` event.
 *
 * Signal events can carry `details`, but never `values`.
 */
export type RuntimeCoreSignalEvent<
	Name extends string,
> = CoreEventBase<Name, CoreEventKind.signal, CoreEventLevel, CoreEventPhase, CoreEventScope> & {
	id: string;
	ts: number;
	origin: CoreEventOrigin;
	details?: string[];
	values?: never;
};

/**
 * Runtime instance of a `message` event.
 *
 * Message events can carry interpolation `values`, but never signal `details`.
 */
export type RuntimeCoreMessageEvent<
	Name extends string,
> = CoreEventBase<Name, CoreEventKind.message, CoreEventLevel, CoreEventPhase, CoreEventScope> & {
	id: string;
	ts: number;
	origin: CoreEventOrigin;
	values?: Record<string, string>;
	details?: never;
};

/**
 * Runtime event union handled by the core event pipeline.
 */
export type RuntimeCoreEvent<
	Name extends string
> = RuntimeCoreSignalEvent<Name> | RuntimeCoreMessageEvent<Name>


/**
 * Mutable live event store maintained by `EventsManager`.
 *
 * It keeps:
 * - the chronological event list
 * - direct access by runtime id
 * - secondary indexes by kind, phase and level
 */

export type LiveCoreEventsDict = {
	list: RuntimeCoreEvent<string>[];
	byId: Record<string, RuntimeCoreEvent<string>>;
	index: {
		byKind: Partial<Record<CoreEventKind, string[]>>;
		byPhase: Partial<Record<CoreEventPhase, string[]>>;
		byLevel: Partial<Record<CoreEventLevel, string[]>>;
	};
};

/* -------------------------------------------------------------------------- */
/* Key extraction helpers                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Extract event keys by declared kind.
 */
export type EventKeysByKind<
	TEvents extends CoreEventsShape,
	TKind extends CoreEventKind
> = keyof {
	[K in keyof TEvents as
	TEvents[K]["kind"] extends TKind ? K : never
	]: true;
};

/**
 * Extract event keys by declared level.
 */
export type EventKeysByLevel<
	TEvents extends CoreEventsShape,
	TLevel extends CoreEventLevel
> = keyof {
	[K in keyof TEvents as
	TEvents[K]["level"] extends TLevel ? K : never
	]: true;
};

/**
 * Extract event keys by declared phase.
 */
export type EventKeysByPhase<
	TEvents extends CoreEventsShape,
	TPhase extends CoreEventPhase
> = keyof {
	[K in keyof TEvents as
	TEvents[K]["phase"] extends TPhase ? K : never
	]: true;
};

/**
 * Extract event keys matching both kind and level.
 */
export type EventKeysByKindAndLevel<
	TEvents extends CoreEventsShape,
	TKind extends CoreEventKind,
	TLevel extends CoreEventLevel
> = keyof {
	[K in keyof TEvents as
	TEvents[K]["kind"] extends TKind
	? TEvents[K]["level"] extends TLevel
	? K
	: never
	: never
	]: true;
};


/**
 * Convenience alias for all signal keys in a dictionary.
 */
export type SignalEventKeys<TEvents extends CoreEventsShape> =
	EventKeysByKind<TEvents, CoreEventKind.signal>;

/**
 * Convenience alias for all message keys in a dictionary.
 */
export type MessageEventKeys<TEvents extends CoreEventsShape> =
	EventKeysByKind<TEvents, CoreEventKind.message>;

/**
 * Convenience alias for all `error` level keys.
 */
export type ErrorEventKeys<TEvents extends CoreEventsShape> =
	EventKeysByLevel<TEvents, CoreEventLevel.error>;

/**
 * Convenience alias for all `fatal` level keys.
 */
export type FatalEventKeys<TEvents extends CoreEventsShape> =
	EventKeysByLevel<TEvents, CoreEventLevel.fatal>;

/**
 * Terminal signal keys (`error` or `fatal`).
 */
export type TerminalSignalKeys<TEvents extends CoreEventsShape> =
	EventKeysByKindAndLevel<
		TEvents,
		CoreEventKind.signal,
		CoreEventLevel.error | CoreEventLevel.fatal
	>;

/**
 * Terminal message keys (`error` or `fatal`).
 */
export type TerminalMessageKeys<TEvents extends CoreEventsShape> =
	EventKeysByKindAndLevel<
		TEvents,
		CoreEventKind.message,
		CoreEventLevel.error | CoreEventLevel.fatal
	>;

/**
 * All terminal event keys regardless of kind.
 */
export type TerminalEventKeys<TEvents extends CoreEventsShape> =
	EventKeysByLevel<
		TEvents,
		CoreEventLevel.error | CoreEventLevel.fatal
	>;

/* -------------------------------------------------------------------------- */
/* Emit options                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Emit payload allowed for a given declarative event.
 *
 * - signals accept `details`
 * - messages accept `values`
 */
export type EmitOptionsForEvent<
	E extends CoreEvent<string>
> =
	E["kind"] extends CoreEventKind.signal
	? { details?: string[]; values?: never }
	: E["kind"] extends CoreEventKind.message
	? { values?: Record<string, string>; details?: never }
	: never;

/**
 * Emit payload allowed for a given event key in a dictionary.
 */
export type EmitOptionsForKey<
	TEvents extends CoreEventsShape,
	K extends keyof TEvents
> = EmitOptionsForEvent<TEvents[K]>;

/* -------------------------------------------------------------------------- */
/* Selectors / listeners                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Dictionary key selector for a concrete event.
 */
export type EventDictKey<TEvents extends CoreEventsShape> = keyof TEvents;

/**
 * Selector accepted by listener registration APIs.
 *
 * - a concrete event key targets one declarative event
 * - `"*"` targets every emitted event
 */
export type EventSelector<TEvents extends CoreEventsShape> =
	| EventDictKey<TEvents>
	| "*";

/**
 * Listener shape dedicated to FED flow orchestration.
 *
 * Flow listeners never carry a channel because channels are reserved for
 * passive output dispatch only.
 */
export type EventFlowListener = {
	handler: (event: RuntimeCoreEvent<string>) => Promise<void> | void;
	channel?: never;
};

export type EventOutputListenerContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape

> = {
	translate: I18nTrMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
}

/**
 * Listener shape dedicated to passive output dispatch.
 *
 * `channel` is used by the event dispatcher to isolate output streams and to
 * let runtime listeners override system listeners on the same channel.
 */
export type EventOutputListener<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape

> = {
	handler: (
		event: RuntimeCoreEvent<string>,
		ctx: EventOutputListenerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	) => Promise<string | undefined> | string | undefined;
	channel?: keyof FinalEventsChannels<TChannels> & string;
	level?: CoreEventLevel;
	scope?: CoreEventScope;
};

/**
 * Any listener accepted by the core event system.
 *
 * Concrete registration APIs narrow this union depending on whether they deal
 * with flow listeners or passive output listeners.
 */
export type EventListener<
	TEvents extends CoreEventsShape = {},
	TChannels extends CoreEventsChannelsShape = {},
	TStages extends CoreStagesShape = {},
	TGlobals extends CoreGlobalsShape = {},
	TModules extends CoreModulesShape = {},
	TTranslations extends CoreTranslationsShape = {},
	TApp extends RuntimeAppShape = {}

> = EventFlowListener | EventOutputListener<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
