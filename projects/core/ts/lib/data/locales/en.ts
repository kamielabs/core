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
		name: 'core.parser.init',
		content: 'Parser Init'
	},
	parserInvalidPhase: {
		name: 'core.parser.invalid.phase',
		content: 'Parser Invalid Phase ! needed: {neededPhase}, received: {currentPhase}, from: {method}',
	},
	parserUnknownGlobalFlag: {
		name: 'core.parser.unknown.global.flag',
		content: 'Unknown Global Flag: {flag}'
	},
	parserUnknownModuleFlag: {
		name: 'core.parser.unknown.module.flag',
		content: 'Unknown Module Flag: {flag}'
	},
	parserUnknownActionFlag: {
		name: 'core.parser.unknown.action.flag',
		content: 'Unknown Action Flag: {flag}'
	},
	parserDuplicateFlag: {
		name: 'core.parser.duplicate.flag',
		content: 'Duplicate flag {flag} for option {opt} in {scope} scope'
	},
	parserMissingFlagValue: {
		name: 'core.parser.missing.flag.value',
		content: 'Flag "{flag}" requires a value ({flag}=<value>)'
	},
	parserUnexpectedFlagValue: {
		name: 'core.parser.unexpected.flag.value',
		content: 'Flag "{flag}" does not accept a value'
	},
	parserInvalidShortGroup: {
		name: 'core.parser.invalid.short.group',
		content: 'Flag "{flag}" requires a value and cannot appear before the end of a short group'
	},
	parserMissingModule: {
		name: 'core.parser.missing.module',
		content: 'Module is missing'
	},
	parserMissingAction: {
		name: 'core.parser.missing.action',
		content: 'Action for module {module} is missing'
	},
	parserUnknownModule: {
		name: 'core.parser.unknown.module',
		content: 'Unknown Module: {module}'
	},
	parserUnknownAction: {
		name: 'core.parser.unknown.action',
		content: 'Unknown Action: {action} in module {module}'
	},
	parserReady: {
		name: 'core.parser.ready',
		content: 'Parser Ready !'
	},
	stageReady: {
		name: 'core.stage.ready',
		content: 'Stage {stage} Ready!'
	},
	globalsInit: {
		name: "core.globals.init",
		content: "Global Flags Manager Init"
	},
	globalsHooking: {
		name: "core.globals.hooking",
		content: "Global Flags Hooking"
	},
	globalsReady: {
		name: "core.globals.ready",
		title: "Global Flags Manager Ready",
		description: 'Global Options:\n{globals}'
	},
	modulesInit: {
		name: "core.modules.init",
		content: "Module Parsing Init"
	},
	modulesHooking: {
		name: "core.modules.hooking",
		content: "Module Flags Hooking"
	},
	modulesReady: {
		name: "core.modules.ready",
		title: "Module Parsing Ready",
		description: ""
	},
	runtimeReady: {
		name: "core.runtime.ready",
		content: "Runtime fully resolved, enjoy !"
	},
	parserUsageSingle: {
		name: 'core.parser.usage.single',
		content: "Help: {helpCli}"
	},
	parserUsageModular: {
		name: 'core.parser.usage.modular',
		content: "Full Help: {helpCli}"
	},
	parserUsageModule: {
		name: 'core.parser.usage.module',
		content: "Help: {helpCli} {module}"
	},
	parserUsageAction: {
		name: 'core.parser.usage.action',
		content: "Help: {helpCli} {module} {action}"
	},
	parserUsageGlobalFlag: {
		name: 'core.parser.usage.global.flag',
		content: "Help: {helpCli} {flag}"
	},
	parserUsageModuleFlag: {
		name: 'core.parser.usage.module.flag',
		content: "Help: {helpCli} {module} {flag}"
	},
	parserUsageActionFlag: {
		name: 'core.parser.usage.action.flag',
		content: "Help: {helpCli} {module} {action} {flag}"
	},
	modulesMissingActionHook: {
		name: "core.modules.missing.action.hook",
		content: "hook for module/action {module}/{action} doesn't exit"
	},
	runtimeErrorModuleHelp: {
		name: 'core.runtime.error.module.help',
		content: "Full Help: {helpCli} help/--help"
	}

} as const satisfies CoreMessagesShape
