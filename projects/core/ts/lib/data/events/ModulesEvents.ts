import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin modules event declarations.
 *
 * Covers modules state guards, module/action structure validation failures,
 * modules lifecycle flow events, and final action-runner lookup failures.
 */
export const BUILTIN_MODULES_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	modulesMissingDraft: {
		name: 'CORE_MODULES_MISSING_DRAFT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules
	},
	modulesAlreadyResolved: {
		name: 'CORE_MODULES_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
	},
	modulesMissingResolved: {
		name: 'CORE_MODULES_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
	},
	// Globals Indexes Fatal & Error (have to be signals)
	modulesConflictModule: {
		name: 'CORE_MODULES_CONFLICT_MODULE',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules
	},
	modulesConflictAction: {
		name: 'CORE_MODULES_CONFLICT_ACTION',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules
	},
	// FLOW messages
	modulesInit: {
		name: 'CORE_MODULES_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
	},
	modulesHooking: {
		name: 'CORE_MODULES_HOOKING',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
	},
	modulesReady: {
		name: 'CORE_MODULES_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
	modulesMissingActionHook: {
		name: 'CORE_MODULES_MISSING_ACTION_HOOK',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules
	},
	// Flow Errors
} as const satisfies CoreEventsShape;
