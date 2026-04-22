import { CoreEngineName } from "@data";
import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	ParsedOptionValue,
	ParserIssue,
	RuntimeGlobalsFacts,
	CoreModulesShape,
	CoreTranslationsShape,
	CoreEventLevelLabel
} from "@types";

/**
 * Base Runtime Context for CLI Parsing
 * TO be expose bu RuntimeService ? or perhaps the engine ?
 * Or do we need to do  a managerClass for the parsing
 * its perhaps the best approach
 */
export interface RuntimeCliContext {
	globals?: RuntimeGlobalsFacts;
	module?: string;
	moduleOptions?: Record<string, ParsedOptionValue>;
	action?: string | undefined;
	actionOptions?: Record<string, ParsedOptionValue>;
	args?: string[];
}

export interface ParsedCliContextResult {
	context: RuntimeCliContext;
	ignored: string[];
	issues: ParserIssue[];
}

export type CLISettings = {
	coreConsoleLevel?: keyof typeof CoreEventLevelLabel;
	defaultStageName?: string;
	engine?: CoreEngineName;
}

export type CLIOptions<
	TCustomEvents extends CoreEventsShape = {},
	TCustomStages extends CoreStagesShape = {},
	TCustomGlobals extends CoreGlobalsShape = {},
	TCustomModules extends CoreModulesShape = {},
	TCustomTranslations extends CoreTranslationsShape = {}
> = {
	settings?: CLISettings;
	events?: TCustomEvents;
	stages?: TCustomStages;
	translations?: TCustomTranslations;
	globals?: TCustomGlobals;
	modules?: TCustomModules;
}

