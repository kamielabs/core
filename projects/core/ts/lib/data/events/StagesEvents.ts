import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create stages CoreErrors into signal events

/**
 * Builtin stages event declarations.
 *
 * Covers stages state guards, stage selection/option validation failures, and
 * stage lifecycle flow events.
 */
export const BUILTIN_STAGES_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	stagesMissingDraft: {
		name: 'CORE_STAGES_MISSING_DRAFT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stagesAlreadyResolved: {
		name: 'CORE_STAGES_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stagesMissingResolved: {
		name: 'CORE_STAGES_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	// FLOW Signals
	stageInit: {
		name: 'CORE_STAGE_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stageHooking: {
		name: 'CORE_STAGE_HOOKING',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stageReady: {
		name: 'CORE_STAGE_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.stage,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
	// Stage Resolution Fatal Errors
	stageDuplicateEnv: {
		name: 'CORE_STAGE_DUPLICATE_ENV',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissing: {
		name: 'CORE_STAGE_MISSING',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingFile: {
		name: 'CORE_STAGE_MISSING_FILE',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingLang: {
		name: 'CORE_STAGE_MISSING_LANG',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingWorkingDir: {
		name: 'CORE_STAGE_MISSING_WORKING_DIR',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
} as const satisfies CoreEventsShape;
