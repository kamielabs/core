import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// NOTE: After bootstrap, stages and i18n ready, all events are messages
// TODO: add warning events to match parserIssues to events

/**
 * Builtin parser event declarations.
 *
 * Covers parser state guards, strict phase-order violations, and parser
 * lifecycle flow events.
 */
export const BUILTIN_PARSER_EVENTS = {
	// INIT/DICTS FATAL ERRORS (have to be signals)
	parserMissingDraft: {
		name: 'CORE_PARSER_MISSING_DRAFT',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.parser
	},
	parserMissingResolved: {
		name: 'CORE_PARSER_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.parser
	},
	// FLOW Messages (Fatal Invalid Phase here is consider like a flow event)
	parserInit: {
		name: 'CORE_PARSER_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserInvalidPhase: {
		name: 'CORE_PARSER_INVALID_PHASE',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserReady: {
		name: 'CORE_PARSER_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	}
} as const satisfies CoreEventsShape;
