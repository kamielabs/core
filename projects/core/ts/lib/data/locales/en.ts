import { CoreMessagesShape } from "@types";

/**
 * Builtin English message dictionary.
 *
 * Current role:
 * - base builtin i18n reference used by the core
 *
 * Forward-compat note:
 * - message `code` values are expected to become event `name` references
 * - they must stay aligned with builtin events declared as `kind: message`
 */
export const BUILTIN_EN_MESSAGES = {
	parserInit: {
		code: 'CORE_PARSER_INIT',
		content: 'Parser Init'
	},
	parserInvalidPhase: {
		code: 'CORE_PARSER_INVALID_PHASE',
		content: 'Parser Invalid Phase !',
	},
	parserReady: {
		code: 'CORE_PARSER_READY',
		content: 'Parser Ready !'
	},
	stageReady: {
		code: 'CORE_STAGE_READY',
		content: 'Stage {stage} Ready!'
	},
	globalsInit: {
		code: "CORE_GLOBALS_INIT",
		content: "Global Flags Manager Init"
	},
	globalsHooking: {
		code: "CORE_GLOBALS_HOOKING",
		content: "Global Flags Hooking"
	},
	globalsReady: {
		code: "CORE_GLOBALS_READY",
		title: "Global Flags Manager Ready",
		description: 'Global Options:\n{globals}'
	},
	modulesInit: {
		code: "CORE_MODULES_INIT",
		content: "Module Parsing Init"
	},
	modulesHooking: {
		code: "CORE_MODULES_HOOKING",
		content: "Module Flags Hooking"
	},
	modulesReady: {
		code: "CORE_MODULES_READY",
		title: "Module Parsing Ready",
		description: ""
	},
	runtimeReady: {
		code: "CORE_RUNTIME_READY",
		content: "Runtime fully resolved, enjoy !"
	}
} as const satisfies CoreMessagesShape
