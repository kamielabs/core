import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	BuiltinActionFlags
} from "@types";

import { ActionHook } from "@contexts";

export const versionAction = <
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
>(): ActionHook<TEvents, TStages, TGlobals, TModules, TTranslations, BuiltinActionFlags<TModules, 'version', "__defaultAction__">> => {

	return ({ snapshot }) => {
		if (snapshot.meta.cli.name) {
			console.log(snapshot.meta.cli.name);
		}

		if (snapshot.meta.cli.version) {
			console.log("Version:", snapshot.meta.cli.version);
		}
		console.log(`Powered by kamie-oss/core@${snapshot.meta.core.version}`);
	}
};
