import { CoreMessagesShape } from "@types";

export const BUILTIN_EN_MESSAGES = {
	parserInit: {
		code: 'CORE_EVENT_PARSER_INIT',
		title: 'Parser Init',
		description: ''
	},
	parsingDone: {
		code: 'CORE_EVENT_PARSING_DONE',
		title: 'Parser Ready !',
		description: '',
	},
	parserFatal: {
		code: "CORE_EVENT_PARSER_FATAL",
		title: 'Parser Fatal Error !',
		description: '',
	},

	globalsInit: {
		code: "CORE_EVENT_GLOBALS_INIT",
		title: "Global Flags Manager Init",
		description: "",
	},
	globalsHooking: {
		code: "CORE_EVENT_GLOBALS_HOOKING",
		title: "Global Options Hooking",
		description: ''
	},
	globalsReady: {
		code: "CORE_EVENT_GLOBALS_READY",
		title: "Global Flas Manager Ready",
		description: "global flags parsing done"
	},
	globalsFatal: {
		code: "CORE_EVENT_GLOBALS_FATAL",
		title: "Globals Flags Manager Fatal Error",
		description: ""
	},
	modulesInit: {
		code: "CORE_EVENT_MODULES_INIT",
		title: "Module Parsing Init",
		description: ""
	},
	modulesReady: {
		code: "CORE_EVENT_MODULES_READY",
		title: "Module Parsing Ready",
		description: ""
	},
	modulesFatal: {
		code: "CORE_EVENT_MODULES_FATAL",
		title: "Module Parsing Fatal Error",
		description: ""
	},
	actionInit: {
		code: "CORE_EVENT_ACTION_INIT",
		title: "Action Init",
		description: ""
	},
	actionReady: {
		code: "CORE_EVENT_ACTION_READY",
		title: "Action ready to be executed",
		description: ""
	},
	runtimeReady: {
		code: "CORE_EVENT_RUNTIME_READY",
		title: "Runtime fully resolved, enjoy !",
		description: ""
	}
} satisfies CoreMessagesShape
