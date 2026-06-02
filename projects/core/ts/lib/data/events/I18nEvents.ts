
import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin i18n event declarations.
 *
 * Covers i18n state guards, language/dictionary validation failures, and
 * translation lookup warnings/fallback reporting.
 */
export const BUILTIN_I18N_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	i18nAlreadyResolved: {
		name: 'core.i18n.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	i18nMissingResolved: {
		name: 'core.i18n.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	// FLOW Signals
	i18nInit: {
		name: 'core.i18n.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	i18nReady: {
		name: 'core.i18n.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	// I18n Lang & Messages Resolution Fatal & Error
	i18nMissingLang: {
		name: 'core.i18n.missing.lang',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nMissingBuiltinMessage: {
		name: 'core.i18n.missing.builtin.message',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nUnknownKeys: {
		name: 'core.i18n.unknown.keys',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	// I18n warnings, issued but not blocking core to run
	i18nMissingKeys: {
		name: 'core.i18n.missing.keys',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nMissingMessageValues: {
		name: 'core.i18n.missing.message.values',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nFallbackUsed: {
		name: 'core.i18n.fallback.used',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},

} as const satisfies CoreEventsShape;
