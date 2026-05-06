import { CoreMessagesShape } from "@types";

/**
 * Builtin English message dictionary.
 *
 * Current role:
 * - base builtin i18n reference used by the core
 *
 * Forward-compat note:
 * - message `name` values are expected to become event `name` references
 * - they must stay aligned with builtin events declared as `kind: message`
 */
export const BUILTIN_EN_MESSAGES = {
	parserInit: {
		name: 'CORE_PARSER_INIT',
		content: 'Parser Init'
	},
	parserInvalidPhase: {
		name: 'CORE_PARSER_INVALID_PHASE',
		content: 'Parser Invalid Phase !',
	},
	parserReady: {
		name: 'CORE_PARSER_READY',
		content: 'Parser Ready !'
	},
	stageReady: {
		name: 'CORE_STAGE_READY',
		content: 'Stage {stage} Ready!'
	},
	globalsInit: {
		name: "CORE_GLOBALS_INIT",
		content: "Global Flags Manager Init"
	},
	globalsHooking: {
		name: "CORE_GLOBALS_HOOKING",
		content: "Global Flags Hooking"
	},
	globalsReady: {
		name: "CORE_GLOBALS_READY",
		title: "Global Flags Manager Ready",
		description: 'Global Options:\n{globals}'
	},
	modulesInit: {
		name: "CORE_MODULES_INIT",
		content: "Module Parsing Init"
	},
	modulesHooking: {
		name: "CORE_MODULES_HOOKING",
		content: "Module Flags Hooking"
	},
	modulesReady: {
		name: "CORE_MODULES_READY",
		title: "Module Parsing Ready",
		description: ""
	},
	runtimeReady: {
		name: "CORE_RUNTIME_READY",
		content: "Runtime fully resolved, enjoy !"
	},
	modulesMissingActionHook: {
		name: "CORE_MODULES_MISSING_ACTION_HOOK",
		content: "hook for module/action {module}/{action} doesn't exit"
	}

} as const satisfies CoreMessagesShape
