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
		name: 'core.parser.missing.draft',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.parser
	},
	parserMissingResolved: {
		name: 'core.parser.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.parser
	},
	// FLOW Messages (Fatal Invalid Phase here is consider like a flow event)
	parserInit: {
		name: 'core.parser.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserInvalidPhase: {
		name: 'core.parser.invalid.phase',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnknownGlobalFlag: {
		name: 'core.parser.unknown.global.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnknownModuleFlag: {
		name: 'core.parser.unknown.module.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnknownActionFlag: {
		name: 'core.parser.unknown.action.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserDuplicateFlag: {
		name: 'core.parser.duplicate.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserMissingFlagValue: {
		name: 'core.parser.missing.flag.value',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnexpectedFlagValue: {
		name: 'core.parser.unexpected.flag.value',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserInvalidShortGroup: {
		name: 'core.parser.invalid.short.group',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserMissingModule: {
		name: 'core.parser.missing.module',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserMissingAction: {
		name: 'core.parser.missing.action',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnknownModule: {
		name: 'core.parser.unknown.module',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUnknownAction: {
		name: 'core.parser.unknown.action',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageSingle: {
		name: 'core.parser.usage.single',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageModular: {
		name: 'core.parser.usage.modular',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageAllModules: {
		name: 'core.parser.usage.all.modules',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageModule: {
		name: 'core.parser.usage.module',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageAction: {
		name: 'core.parser.usage.action',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageGlobalFlag: {
		name: 'core.parser.usage.global.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageModuleFlag: {
		name: 'core.parser.usage.module.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserUsageActionFlag: {
		name: 'core.parser.usage.action.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	},
	parserReady: {
		name: 'core.parser.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser
	}
} as const satisfies CoreEventsShape;

