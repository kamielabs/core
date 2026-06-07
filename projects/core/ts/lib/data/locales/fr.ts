import { CoreMessagesShape } from "@types";

/**
 * Builtin French message dictionary.
 *
 * Current role:
 * - secondary builtin locale derived from the English reference dictionary
 *
 * Forward-compat note:
 * - message `name` values are expected to become event `name` references
 * - they must stay aligned with builtin events declared as `kind: message`
 */
export const BUILTIN_FR_MESSAGES = {
	parserInit: {
		name: 'core.parser.init',
		content: 'Initialisation du parser'
	},
	parserInvalidPhase: {
		name: 'core.parser.invalid.phase',
		content: 'Phase du parser invalide !',
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
		content: 'Duplicate flag {flag} for option {opt} in current scope'
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
		content: 'Flag "${flag}" requires a value and cannot appear before the end of a short group'
	},
	parserMissingModule: {
		name: 'core.parser.missing.module',
		content: 'Module is missing'
	},
	parserMissingAction: {
		name: 'core.parser.missing.action',
		content: 'Action is missing'
	},
	parserUnknownModule: {
		name: 'core.parser.unknown.module',
		content: 'Unknown Module: {module}'
	},
	parserUnknownAction: {
		name: 'core.parser.unknown.action',
		content: 'Unknown Action: {action}'
	},
	parserReady: {
		name: 'core.parser.ready',
		content: 'Parser prêt !'
	},
	stageReady: {
		name: 'core.stage.ready',
		content: 'Stage {stage} prêt !'
	},
	globalsInit: {
		name: "core.globals.init",
		content: "Initialisation du gestionnaire des options globales"
	},
	globalsHooking: {
		name: "core.globals.hooking",
		content: "Application des hooks des options globales"
	},
	globalsReady: {
		name: "core.globals.ready",
		title: "Gestionnaire des options globales prêt",
		description: 'Options globales :\n{globals}'
	},
	modulesInit: {
		name: "core.modules.init",
		content: "Initialisation du parsing des modules"
	},
	modulesHooking: {
		name: "core.modules.hooking",
		content: "Application des hooks des options de module"
	},
	modulesReady: {
		name: "core.modules.ready",
		title: "Parsing des modules prêt",
		description: ""
	},
	runtimeReady: {
		name: "core.runtime.ready",
		content: "Runtime entièrement prêt, profitez-en !"
	},
	parserUsageSingle: {
		name: 'core.parser.usage.single',
		content: "Help: {helpCli}"
	},
	parserUsageModular: {
		name: 'core.parser.usage.modular',
		content: "Full Help: {helpCli}"
	},
	parserUsageAllModules: {
		name: 'core.parser.usage.all.modules',
		content: "Help: {helpCli} {module}"
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
		content: "hook du module/action {module}/{action} n'existe pas !"
	},
	runtimeErrorModuleHelp: {
		name: 'core.runtime.error.module.help',
		content: "Full Help: {helpCli} help/--help"
	}
} as const satisfies CoreMessagesShape;
