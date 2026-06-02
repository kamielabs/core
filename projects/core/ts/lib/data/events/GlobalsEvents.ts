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
		name: 'core.globals.missing.draft',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsAlreadyResolved: {
		name: 'core.globals.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals,
	},
	globalsMissingResolved: {
		name: 'core.globals.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals,
	},
	// Globals Indexes Fatal & Error (have to be signals)
	globalsDuplicateEnv: {
		name: 'core.globals.duplicate.env',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsConflictEnv: {
		name: 'core.globals.conflict.env',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	globalsDuplicateFlag: {
		name: 'core.globals.duplicate.flag',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.globals
	},
	// FLOW Signals
	globalsInit: {
		name: 'core.globals.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
	},
	globalsHooking: {
		name: 'core.globals.hooking',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
	},
	globalsReady: {
		name: 'core.globals.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.globals,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
} as const satisfies CoreEventsShape;
