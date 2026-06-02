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
		name: 'core.runtime.missing.draft',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeAlreadyResolved: {
		name: 'core.runtime.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeMissingResolved: {
		name: 'core.runtime.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	// Runtime Transition Fatal (have to be signals)
	runtimeInvalidTransition: {
		name: 'core.runtime.invalid.transition',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime
	},
	runtimeMissingEvent: {
		name: 'core.runtime.missing.event',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime,
		trigger: false
	},

	// FLOW messages
	runtimeInit: {
		name: 'core.runtime.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.runtime,
		trigger: true
	},
	runtimeErrorModuleHelp: {
		name: 'core.runtime.error.module.help',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.runtime,
	},
	runtimeReady: {
		name: 'core.runtime.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.runtime,
		trigger: true
	}
} as const satisfies CoreEventsShape;
