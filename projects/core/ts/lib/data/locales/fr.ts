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
		name: 'CORE_PARSER_INIT',
		content: 'Initialisation du parser'
	},
	parserInvalidPhase: {
		name: 'CORE_PARSER_INVALID_PHASE',
		content: 'Phase du parser invalide !',
	},
	parserReady: {
		name: 'CORE_PARSER_READY',
		content: 'Parser prêt !'
	},
	stageReady: {
		name: 'CORE_STAGE_READY',
		content: 'Stage {stage} prêt !'
	},
	globalsInit: {
		name: "CORE_GLOBALS_INIT",
		content: "Initialisation du gestionnaire des options globales"
	},
	globalsHooking: {
		name: "CORE_GLOBALS_HOOKING",
		content: "Application des hooks des options globales"
	},
	globalsReady: {
		name: "CORE_GLOBALS_READY",
		title: "Gestionnaire des options globales prêt",
		description: 'Options globales :\n{globals}'
	},
	modulesInit: {
		name: "CORE_MODULES_INIT",
		content: "Initialisation du parsing des modules"
	},
	modulesHooking: {
		name: "CORE_MODULES_HOOKING",
		content: "Application des hooks des options de module"
	},
	modulesReady: {
		name: "CORE_MODULES_READY",
		title: "Parsing des modules prêt",
		description: ""
	},
	runtimeReady: {
		name: "CORE_RUNTIME_READY",
		content: "Runtime entièrement prêt, profitez-en !"
	},
	modulesMissingActionHook: {
		name: "CORE_MODULES_MISSING_ACTION_HOOK",
		content: "hook du module/action {module}/{action} n'existe pas !"
	}

} as const satisfies CoreMessagesShape;
