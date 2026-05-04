import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin globals event declarations.
 *
 * Covers globals state guards, globals declaration/index validation failures,
 * and globals lifecycle flow events.
 */
export const BUILTIN_GLOBALS_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	globalsMissingDraft: {
		name: 'CORE_GLOBALS_MISSING_DRAFT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsAlreadyResolved: {
		name: 'CORE_GLOBALS_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals,
	},
	globalsMissingResolved: {
		name: 'CORE_GLOBALS_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals,
	},
	// Globals Indexes Fatal & Error (have to be signals)
	globalsDuplicateEnv: {
		name: 'CORE_GLOBALS_DUPLICATE_ENV',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsConflictEnv: {
		name: 'CORE_GLOBALS_CONFLICT_ENV',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsDuplicateFlag: {
		name: 'CORE_GLOBALS_DUPLICATE_FLAG',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	// FLOW Signals
	globalsInit: {
		name: 'CORE_GLOBALS_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
	},
	globalsHooking: {
		name: 'CORE_GLOBALS_HOOKING',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
	},
	globalsReady: {
		name: 'CORE_GLOBALS_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
} as const satisfies CoreEventsShape;
