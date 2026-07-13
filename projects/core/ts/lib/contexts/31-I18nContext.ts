import { CoreHelpers } from "@helpers";
import { EventsManager, I18nManager, StagesManager } from "@managers";
import { CLISettings, CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, RuntimeAppShape } from "@types";

export type I18nManagerContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	settings: CLISettings;
	events: EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	helpers: { core: CoreHelpers },
	stages: {
		getResolved: StagesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["getResolved"]
	}
}

export type I18nTrMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = I18nManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["tr"];
