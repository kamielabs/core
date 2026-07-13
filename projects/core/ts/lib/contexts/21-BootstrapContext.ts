import { CoreHelpers } from "@helpers"
import { EventsManager } from "@managers"
import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape
} from "@types"

export type BootstrapManagerContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	events: {
		throw: EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["throw"]
	}
	helpers: {
		core: CoreHelpers
	}
}
