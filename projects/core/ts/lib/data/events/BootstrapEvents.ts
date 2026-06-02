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
		name: 'core.bootstrap.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	bootstrapMissingResolved: {
		name: 'core.bootstrap.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	// FLOW Signals
	bootstrapInit: {
		name: 'core.bootstrap.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap
	},
	bootstrapReady: {
		name: 'core.bootstrap.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.bootstrap,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	}
} as const satisfies CoreEventsShape;
