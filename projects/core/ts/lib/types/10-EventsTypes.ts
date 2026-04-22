export enum CoreEventKind {
	signal,
	message
}

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

export enum CoreEventLevel {
	trace,
	debug,
	info,
	warning,
	error,
	fatal
}

export type EventKindRecords = Record<string, CoreEventKind>;
export type EventPhaseRecords = Record<string, CoreEventPhase>;
export type EventLevelRecords = Record<string, CoreEventLevel>;

export const CoreEventKindLabel = {
	signal: CoreEventKind.signal,
	message: CoreEventKind.message,
} as const satisfies EventKindRecords;

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

export const CoreEventLevelLabel = {
	trace: CoreEventLevel.trace,
	debug: CoreEventLevel.debug,
	info: CoreEventLevel.info,
	warning: CoreEventLevel.warning,
	error: CoreEventLevel.error,
	fatal: CoreEventLevel.fatal,
} as const satisfies EventLevelRecords;

export type CoreEventBase<Code extends string, Kind extends CoreEventKind> = {
	code: Code;
	kind: Kind;
	level: CoreEventLevel;
	phase: CoreEventPhase;
	label?: string;
	trigger?: boolean;
}

export type CoreEventSignal<Code extends string> = CoreEventBase<Code, CoreEventKind.signal> & {}


export type CoreEventMessage<Code extends string> = CoreEventBase<Code, CoreEventKind.message> & {}

export type CoreEvent<Code extends string> = CoreEventSignal<Code> | CoreEventMessage<Code>;

export type CoreEventsShape = Record<string, CoreEvent<string>>;



export type RuntimeCoreSignalEvent<Code extends string> = CoreEventSignal<Code> & {
	details?: string[];
}

export type RuntimeCoreMessageEvent<Code extends string> = CoreEventMessage<Code> & {
	values?: Record<string, string>;
}

export type RuntimeCoreEvent<Code extends string> = {
	id: string;
	ts: number;
} & (RuntimeCoreSignalEvent<Code> | RuntimeCoreMessageEvent<Code>);

export type LiveCoreEventsDict = {
	list: RuntimeCoreEvent<string>[];
	byId: Record<string, RuntimeCoreEvent<string>>;
	index: {
		byKind: Partial<Record<CoreEventKind, string[]>>; // string[] is an array of ids from ulid() 
		byPhase: Partial<Record<CoreEventPhase, string[]>>; // string[] is an array of ids from ulid() 
		byLevel: Partial<Record<CoreEventLevel, string[]>>; // string[] is an array of ids from ulid() 
	}
}
export type EmitOptionsForEvent<E> =
	E extends { kind: CoreEventKind.signal }
	? { details?: string[] }
	: E extends { kind: CoreEventKind.message }
	? { values?: Record<string, string> }
	: never;

export type EmitOptionsForKey<
	TEvents extends CoreEventsShape,
	K extends keyof TEvents
> = EmitOptionsForEvent<TEvents[K]>;

export type EventKeysByKind<
	TEvents,
	TKind extends CoreEventKind
> = {
	[K in keyof TEvents]:
	TEvents[K] extends { kind: TKind }
	? K
	: never
}[keyof TEvents];

export type SignalEventKeys<TEvents extends CoreEventsShape> = EventKeysByKind<TEvents, CoreEventKind.signal>
export type MessageEventKeys<TEvents extends CoreEventsShape> = EventKeysByKind<TEvents, CoreEventKind.message>

export type EventDictKey<TEvents extends CoreEventsShape> = keyof TEvents;
export type EventSelector<TEvents extends CoreEventsShape> = EventDictKey<TEvents> | "*";

export type EventListener = {
	handler: (event: RuntimeCoreEvent<string>) => Promise<void> | void;
	channel?: string;
}

