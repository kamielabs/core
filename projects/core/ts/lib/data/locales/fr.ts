import { CoreMessagesShape } from "@types";

/**
 * Builtin French message dictionary.
 *
 * Current role:
 * - secondary builtin locale derived from the English reference dictionary
 *
 * Forward-compat note:
 * - message `code` values are expected to become event `name` references
 * - they must stay aligned with builtin events declared as `kind: message`
 */
export const BUILTIN_FR_MESSAGES = {
	parserInit: {
		code: 'CORE_PARSER_INIT',
		content: 'Initialisation du parser'
	},
	parserInvalidPhase: {
		code: 'CORE_PARSER_INVALID_PHASE',
		content: 'Phase du parser invalide !',
	},
	parserReady: {
		code: 'CORE_PARSER_READY',
		content: 'Parser prêt !'
	},
	stageReady: {
		code: 'CORE_STAGE_READY',
		content: 'Stage {stage} prêt !'
	},
	globalsInit: {
		code: "CORE_GLOBALS_INIT",
		content: "Initialisation du gestionnaire des options globales"
	},
	globalsHooking: {
		code: "CORE_GLOBALS_HOOKING",
		content: "Application des hooks des options globales"
	},
	globalsReady: {
		code: "CORE_GLOBALS_READY",
		title: "Gestionnaire des options globales prêt",
		description: 'Options globales :\n{globals}'
	},
	modulesInit: {
		code: "CORE_MODULES_INIT",
		content: "Initialisation du parsing des modules"
	},
	modulesHooking: {
		code: "CORE_MODULES_HOOKING",
		content: "Application des hooks des options de module"
	},
	modulesReady: {
		code: "CORE_MODULES_READY",
		title: "Parsing des modules prêt",
		description: ""
	},
	runtimeReady: {
		code: "CORE_RUNTIME_READY",
		content: "Runtime entièrement prêt, profitez-en !"
	}
} as const satisfies CoreMessagesShape;
