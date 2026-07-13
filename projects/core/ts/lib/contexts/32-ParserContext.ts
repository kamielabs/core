import { EventsManager, ParserManager } from "@managers";
import { CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, RuntimeAppShape } from "@types";

export type ParserHelpersContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	events: Pick<
		EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		"emit" | "warn" | "throw"
	>;

	parser: Pick<
		ParserManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		"getDraft" | "getPhase"
	>;
};
