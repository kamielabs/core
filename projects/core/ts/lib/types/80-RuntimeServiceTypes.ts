import {
	RuntimeCoreFacts,
	RuntimeStageFacts,
	RuntimeGlobalsFacts,
	RuntimeModuleFacts,
	RuntimeI18nFacts
} from "@types";

export enum RuntimeStateEnum {
	init,
	bootstrap,
	stage,
	i18n,
	globals,
	module,
	ready
};

export const RuntimeStateToLabel = {
	0: 'init',
	1: 'bootstrap',
	2: 'stage',
	3: 'i18n',
	4: 'globals',
	5: 'module',
	6: 'ready',
};


export const RuntimeStateFromLabel = {
	'init': RuntimeStateEnum.init,
	'bootstrap': RuntimeStateEnum.bootstrap,
	'stage': RuntimeStateEnum.stage,
	'i18n': RuntimeStateEnum.i18n,
	'globals': RuntimeStateEnum.globals,
	'module': RuntimeStateEnum.module,
	'ready': RuntimeStateEnum.ready,
};
export type RuntimeStateLabel = keyof typeof RuntimeStateFromLabel;

export type RuntimeStateTransitions = {
	[state in RuntimeStateEnum]: RuntimeStateEnum[];
}

/**
 * RuntimeService Types
 */
export type RuntimeFullFacts = {
	bootstrap?: RuntimeCoreFacts;
	stage?: RuntimeStageFacts;
	i18n?: RuntimeI18nFacts;
	globals?: RuntimeGlobalsFacts;
	module?: RuntimeModuleFacts;
}

