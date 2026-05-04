import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin engine event declarations.
 *
 * These events cover engine-selection failures detected before a concrete
 * engine instance can run the core lifecycle.
 */
export const BUILTIN_ENGINE_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	engineUnknown: {
		name: 'CORE_ENGINE_UNKNOWN',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	engineUnknownRunner: {
		name: 'CORE_ENGINE_UNKNOWN_RUNNER',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
} as const satisfies CoreEventsShape;
