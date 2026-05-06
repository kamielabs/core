
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
		name: 'CORE_I18N_ALREADY_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	i18nMissingResolved: {
		name: 'CORE_I18N_MISSING_RESOLVED',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	// FLOW Signals
	i18nInit: {
		name: 'CORE_I18N_INIT',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	i18nReady: {
		name: 'CORE_I18N_READY',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n,
	},
	// I18n Lang & Messages Resolution Fatal & Error
	i18nMissingLang: {
		name: 'CORE_I18N_MISSING_LANG',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nMissingBuiltinMessage: {
		name: 'CORE_I18N_MISSING_BUILTIN_MESSAGE',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nUnknownKeys: {
		name: 'CORE_I18N_UNKNOWN_KEYS',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	// I18n warnings, issued but not blocking core to run
	i18nMissingKeys: {
		name: 'CORE_I18N_MISSING_KEYS',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nMissingMessageValues: {
		name: 'CORE_I18N_MISSING_MESSAGE_VALUES',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},
	i18nFallbackUsed: {
		name: 'CORE_I18N_FALLBACK_USED',
		level: CoreEventLevel.warning,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.i18n
	},

} as const satisfies CoreEventsShape;
