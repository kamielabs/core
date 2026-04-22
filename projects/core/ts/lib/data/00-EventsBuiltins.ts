import { CoreEventKind, CoreEventLevel, CoreEventPhase, CoreEventsShape } from "@types";

export const BUILTIN_EVENTS = {
	// runtimeInit here
	// engineReady ?
	bootstrapInit: {
		code: 'CORE_EVENT_BOOTSTRAP_INIT',
		phase: CoreEventPhase.bootstrap,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.trace,
		label: "Shell Env"
	},
	bootstrapReady: {
		code: 'CORE_EVENT_BOOTSTRAP_READY',
		phase: CoreEventPhase.bootstrap,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.debug,
		trigger: true,
		label: 'Shell Env Loaded'
	},
	bootstrapFatal: {
		code: 'CORE_EVENT_BOOTSTRAP_FATAL',
		phase: CoreEventPhase.bootstrap,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.fatal
	},
	stageInit: {
		code: "CORE_EVENT_STAGE_INIT",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.trace
	},
	stageParsing: {
		code: "CORE_EVENT_STAGE_PARSING",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.trace
	},
	stageHooking: {
		code: "CORE_EVENT_STAGE_HOOKING",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.trace
	},
	stageDevSandboxError: {
		code: "CORE_EVENT_STAGE_SANDBOX_ERROR",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageWorkingDirError: {
		code: 'CORE_EVENT_WORKING_DIR_ERROR',
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageDevWorkingDirError: {
		code: 'CORE_EVENT_DEV_WORKING_DIR_ERROR',
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageBuildWorkingDirError: {
		code: "CORE_EVENT_BUILD_WORKING_DIR_ERROR",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageReleaseWorkingDirError: {
		code: "CORE_EVENT_RELEASE_WORKING_DIR_ERROR",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageLangError: {
		code: "CORE_ERROR_STAGE_LANG_NOTFOUND",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	stageFileNotFound: {
		code: "CORE_ERROR_STAGE_FILE_NOT_FOUND",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.fatal
	},
	stageNotFound: {
		code: "CORE_ERROR_STAGE_NOT_FOUND",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.fatal
	},
	stageReady: {
		code: "CORE_EVENT_STAGE_READY",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.debug,
		trigger: true
	},
	stageFatal: {
		code: "CORE_EVENT_STAGE_FATAL",
		phase: CoreEventPhase.stage,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.fatal
	},
	i18nInit: {
		code: "CORE_EVENT_I18N_INIT",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.trace
	},
	i18nReady: {
		code: "CORE_EVENT_I18N_READY",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.debug
	},
	i18nFatal: {
		code: "CORE_EVENT_I18N_NOT_READY",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.fatal
	},
	i18nMissingKeys: {
		code: "CORE_EVENT_I18N_MISSING_KEYS",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.warning
	},
	i18nUnknownKeys: {
		code: "CORE_EVENT_I18N_UNKNOWN_KEYS",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.error
	},
	i18nFallbackUsed: {
		code: "CORE_EVENT_I18N_FALLBACK_USED",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.warning
	},
	i18nMissingMessage: {
		code: "CORE_EVENT_I18N_MISSING_MESSAGE",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.warning
	},
	i18nMissingMessageValues: {
		code: "CORE_EVENT_I18N_MISSING_MESSAGE_VALUE",
		phase: CoreEventPhase.i18n,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.warning
	},
	// runtimeReady here
	// events can be messages now
	parserInit: {
		code: "CORE_EVENT_PARSER_INIT",
		phase: CoreEventPhase.parser,
		kind: CoreEventKind.message,
		level: CoreEventLevel.trace
	},
	parsingDone: {
		code: "CORE_EVENT_PARSING_DONE",
		phase: CoreEventPhase.parser,
		kind: CoreEventKind.message,
		level: CoreEventLevel.debug,
		trigger: true
	},
	// Replace this single Fatal Message by all Parser messages 
	// (for single|modular, globals, modules,actions,args)
	parserFatal: {
		code: "CORE_EVENT_PARSER_FATAL",
		phase: CoreEventPhase.parser,
		kind: CoreEventKind.message,
		level: CoreEventLevel.fatal
	},
	globalsInit: {
		code: "CORE_EVENT_GLOBALS_INIT",
		phase: CoreEventPhase.globals,
		kind: CoreEventKind.message,
		level: CoreEventLevel.trace
	},
	globalsHooking: {
		code: "CORE_EVENT_GLOBALS_HOOKING",
		phase: CoreEventPhase.globals,
		kind: CoreEventKind.message,
		level: CoreEventLevel.trace
	},
	globalsReady: {
		code: "CORE_EVENT_GLOBALS_READY",
		phase: CoreEventPhase.globals,
		kind: CoreEventKind.message,
		level: CoreEventLevel.debug,
		trigger: true
	},
	// Add perhaps globals hooks init, ready and fatal (useful for validating runtime js)
	globalsFatal: {
		code: "CORE_EVENT_GLOBALS_FATAL",
		phase: CoreEventPhase.globals,
		kind: CoreEventKind.message,
		level: CoreEventLevel.fatal
	},
	modulesFatal: {
		code: "CORE_EVENT_MODULES_FATAL",
		phase: CoreEventPhase.modules,
		kind: CoreEventKind.message,
		level: CoreEventLevel.fatal
	},
	actionInit: {
		code: "CORE_EVENT_ACTION_INIT",
		phase: CoreEventPhase.modules,
		kind: CoreEventKind.message,
		level: CoreEventLevel.trace
	},
	actionReady: {
		code: "CORE_EVENT_ACTION_READY",
		phase: CoreEventPhase.modules,
		kind: CoreEventKind.message,
		level: CoreEventLevel.debug,
		trigger: true
	},
	runtimeInit: {
		code: "CORE_EVENT_RUNTIME_INIT",
		phase: CoreEventPhase.runtime,
		kind: CoreEventKind.signal,
		level: CoreEventLevel.debug,
		trigger: true
	},
	runtimeReady: {
		code: "CORE_EVENT_RUNTIME_READY",
		phase: CoreEventPhase.runtime,
		kind: CoreEventKind.message,
		level: CoreEventLevel.debug,
		trigger: true
	}
	// add select and execute events
} satisfies CoreEventsShape;

export type BuiltinEvents = typeof BUILTIN_EVENTS;
export type FinalEvents<TEvents extends CoreEventsShape> = BuiltinEvents & TEvents;
