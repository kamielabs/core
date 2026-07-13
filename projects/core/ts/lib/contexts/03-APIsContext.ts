import { ApiService, CoreConsoleService } from "@api"
import { CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, RuntimeAppShape } from "@types"

export type CoreAPIsContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	devapi: ApiService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
	console: CoreConsoleService<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
}
