import {
	CoreEventsShape
} from "@types";
import {
	BUILTIN_BOOTSTRAP_EVENTS,
	BUILTIN_ENGINE_EVENTS,
	BUILTIN_GLOBALS_EVENTS,
	BUILTIN_I18N_EVENTS,
	BUILTIN_MODULES_EVENTS,
	BUILTIN_PARSER_EVENTS,
	BUILTIN_RUNTIME_EVENTS,
	BUILTIN_STAGES_EVENTS
} from "@data/events";

/**
 * Final builtin event dictionary exposed to the core.
 *
 * This object concatenates every builtin event slice into the single
 * declarative registry consumed by `EventsManager`.
 */
export const BUILTIN_EVENTS = {
	...BUILTIN_BOOTSTRAP_EVENTS,
	...BUILTIN_STAGES_EVENTS,
	...BUILTIN_I18N_EVENTS,
	...BUILTIN_PARSER_EVENTS,
	...BUILTIN_GLOBALS_EVENTS,
	...BUILTIN_MODULES_EVENTS,
	...BUILTIN_RUNTIME_EVENTS,
	...BUILTIN_ENGINE_EVENTS
} as const satisfies CoreEventsShape;

/**
 * Concrete builtin event dictionary type inferred from `BUILTIN_EVENTS`.
 */
export type BuiltinEvents = typeof BUILTIN_EVENTS;

/**
 * Final event dictionary shape once builtin and custom events are merged.
 */
export type FinalEvents<TEvents extends CoreEventsShape> = BuiltinEvents & TEvents;
