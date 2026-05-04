import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

/**
 * Builtin bootstrap event declarations.
 *
 * Covers bootstrap state guards and bootstrap lifecycle flow entry/exit points.
 */
export const BUILTIN_BOOTSTRAP_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	bootstrapAlreadyResolved: {
		name: 'CORE_BOOTSTRAP_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	bootstrapMissingResolved: {
		name: 'CORE_BOOTSTRAP_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	// FLOW Signals
	bootstrapInit: {
		name: 'CORE_BOOTSTRAP_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	bootstrapReady: {
		name: 'CORE_BOOTSTRAP_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	}
} as const satisfies CoreEventsShape;
