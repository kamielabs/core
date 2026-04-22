import { CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, BuiltinActionFlags } from "@types";

import { ActionHook } from "@contexts";

export const helpShow = <
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
>(): ActionHook<TEvents, TStages, TGlobals, TModules, TTranslations, BuiltinActionFlags<TModules, 'help', "show">> => {

	return ({ snapshot }) => {

		console.log("MODULES");
		for (const name in snapshot.modules) {
			console.log(" ", name);
		}
	}
};
