import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin runtime event declarations.
 *
 * Covers runtime state guards, runtime transition failures, and core-wide
 * runtime flow entry/exit points.
 */
export const BUILTIN_RUNTIME_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	runtimeMissingDraft: {
		name: 'CORE_RUNTIME_MISSING_DRAFT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeAlreadyResolved: {
		name: 'CORE_RUNTIME_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeMissingResolved: {
		name: 'CORE_RUNTIME_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	// Runtime Transition Fatal (have to be signals)
	runtimeInvalidTransition: {
		name: 'CORE_RUNTIME_INVALID_TRANSITION',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeMissingEvent: {
		name: 'CORE_RUNTIME_MISSING_EVENT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime,
		trigger: false
	},

	// FLOW messages
	runtimeInit: {
		name: 'CORE_RUNTIME_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime,
		trigger: true
	},
	runtimeReady: {
		name: 'CORE_RUNTIME_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.runtime,
		trigger: true
	}
} as const satisfies CoreEventsShape;
