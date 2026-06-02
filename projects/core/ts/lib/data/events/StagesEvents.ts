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
		name: 'core.stages.missing.draft',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stagesAlreadyResolved: {
		name: 'core.stages.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stagesMissingResolved: {
		name: 'core.stages.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	// FLOW Signals
	stageInit: {
		name: 'core.stage.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stageHooking: {
		name: 'core.stage.hooking',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage,
	},
	stageReady: {
		name: 'core.stage.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.stage,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
	// Stage Resolution Fatal Errors
	stageDuplicateEnv: {
		name: 'core.stage.duplicate.env',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissing: {
		name: 'core.stage.missing',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingFile: {
		name: 'core.stage.missing.file',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingLang: {
		name: 'core.stage.missing.lang',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
	stageMissingWorkingDir: {
		name: 'core.stage.missing.working.dir',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.stage
	},
} as const satisfies CoreEventsShape;
