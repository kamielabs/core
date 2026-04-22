import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	BuiltinActionFlags
} from "@types";

import { ActionHook } from "@contexts";

export const versionShow = <
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
>(): ActionHook<TEvents, TStages, TGlobals, TModules, TTranslations, BuiltinActionFlags<TModules, 'version', "show">> => {

	return () => {
		console.log("CLI Core Version 0.1 (wip)");
	}
};
