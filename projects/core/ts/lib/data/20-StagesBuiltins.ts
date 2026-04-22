import { CoreStagesShape, Option } from "@types";

export const LANG_ENV = "NODE_CLI_LANG";
export const WORKING_DIR_ENV = "WORKING_DIR";

const LangOption: Option<typeof LANG_ENV, string> = {
	env: LANG_ENV,
	default: "en",
	description: "define language to use"
}


const workingDirOption: Option<typeof WORKING_DIR_ENV, string> = {
	env: WORKING_DIR_ENV,
	default: "",
	description: 'Working directory used in stage'
}

export const BUILTIN_STAGES = {
	'default': {
		file: ".env",
		options: {
			lang: LangOption,
			workingDir: workingDirOption,
		}
	}
} as const satisfies CoreStagesShape;
export type BuiltinStages = typeof BUILTIN_STAGES;
export type FinalStages<TStages extends CoreStagesShape> = BuiltinStages & TStages;
