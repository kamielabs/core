import { CoreEngineName, FinalEventsChannels, FinalGlobals, FinalModules, FinalStages, FinalTranslations } from "@data";
import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	ParsedOptionValue,
	RuntimeGlobalsFacts,
	CoreModulesShape,
	CoreTranslationsShape,
	CoreEventLevelLabel,
	CoreMetaShape,
	CoreEventsShapeDecl,
	RuntimeAppShape,
	CoreEventScopeLabel,
	CoreEventsChannelsShape
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
}

export type CoreConsoleSettings = {
	level?: keyof typeof CoreEventLevelLabel;
	scope?: keyof typeof CoreEventScopeLabel;
	showScope?: boolean;
	showOrigin?: boolean;
	showTS?: boolean;
	showLevel?: boolean;
	showPhase?: boolean;
}

export type CLISettings = {
	console?: CoreConsoleSettings;
	defaultStageName?: string;
	engine?: CoreEngineName;
	skipI18nWarnings?: boolean;
}

export type CLIUserSettings<
	TCustomEvents extends CoreEventsShape,
	TCustomChannels extends CoreEventsChannelsShape,
	TCustomStages extends CoreStagesShape,
	TCustomGlobals extends CoreGlobalsShape,
	TCustomModules extends CoreModulesShape,
	TCustomTranslations extends CoreTranslationsShape,
	TCustomApp extends RuntimeAppShape
> = {
	meta?: Partial<CoreMetaShape["cli"]> | undefined;
	settings?: CLISettings | undefined;
	events: CoreEventsShapeDecl<TCustomEvents>;
	channels: FinalEventsChannels<TCustomChannels>;
	stages: FinalStages<TCustomStages>;
	translations: FinalTranslations<TCustomTranslations>;
	globals: FinalGlobals<TCustomGlobals>;
	modules: FinalModules<TCustomModules>;
	app?: TCustomApp;
}

export type CLIOptions<
	TCustomEvents extends CoreEventsShape = {},
	TCustomChannels extends CoreEventsChannelsShape = {},
	TCustomStages extends CoreStagesShape = {},
	TCustomGlobals extends CoreGlobalsShape = {},
	TCustomModules extends CoreModulesShape = {},
	TCustomTranslations extends CoreTranslationsShape = {},
	TCustomApp extends RuntimeAppShape = {}
> = {
	meta?: Partial<CoreMetaShape["cli"]> | undefined;
	settings?: CLISettings;
	events?: TCustomEvents;
	channels?: TCustomChannels;
	stages?: TCustomStages;
	translations?: TCustomTranslations;
	globals?: TCustomGlobals;
	modules?: TCustomModules;
	app?: TCustomApp
}

