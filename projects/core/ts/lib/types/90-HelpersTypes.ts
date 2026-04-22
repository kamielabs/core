import { CoreHelpers } from "@helpers";
import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreTranslationsShape
} from "@types";

export interface HelpersContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {
	core: CoreHelpers<TEvents, TStages, TGlobals, TModules, TTranslations>
}

