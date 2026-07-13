import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventScope,
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
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserMissingResolved: {
		name: 'core.parser.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	// FLOW Messages (Fatal Invalid Phase here is consider like a flow event)
	parserInit: {
		name: 'core.parser.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.core
	},
	parserInvalidPhase: {
		name: 'core.parser.invalid.phase',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnknownGlobalFlag: {
		name: 'core.parser.unknown.global.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnknownModuleFlag: {
		name: 'core.parser.unknown.module.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnknownActionFlag: {
		name: 'core.parser.unknown.action.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserDuplicateFlag: {
		name: 'core.parser.duplicate.flag',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserMissingFlagValue: {
		name: 'core.parser.missing.flag.value',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnexpectedFlagValue: {
		name: 'core.parser.unexpected.flag.value',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserInvalidShortGroup: {
		name: 'core.parser.invalid.short.group',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserMissingModule: {
		name: 'core.parser.missing.module',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserMissingAction: {
		name: 'core.parser.missing.action',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnknownModule: {
		name: 'core.parser.unknown.module',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUnknownAction: {
		name: 'core.parser.unknown.action',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageSingle: {
		name: 'core.parser.usage.single',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageModular: {
		name: 'core.parser.usage.modular',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageAllModules: {
		name: 'core.parser.usage.all.modules',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageModule: {
		name: 'core.parser.usage.module',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageAction: {
		name: 'core.parser.usage.action',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageGlobalFlag: {
		name: 'core.parser.usage.global.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageModuleFlag: {
		name: 'core.parser.usage.module.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserUsageActionFlag: {
		name: 'core.parser.usage.action.flag',
		level: CoreEventLevel.error,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.app
	},
	parserReady: {
		name: 'core.parser.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.parser,
		scope: CoreEventScope.core
	}
} as const satisfies CoreEventsShape;

