import { SnapshotFullContext } from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types";

export type HelpRoute =
	| { route: "normalHelp" }
	| { route: "fullHelp", stage: string }
	| { route: "allGlobalsHelp" }
	| { route: "allModulesHelp" }
	| { route: "allStageEnvsHelp", stage: string }
	| { route: "stageEnvHelp", stage: string, env: string }
	| { route: "globalFlagHelp", group: string, flag: string }
	| { route: "moduleHelp", module: string }
	| { route: "moduleFlagHelp", module: string, flag: string }
	| { route: "actionHelp", module: string, action: string }
	| { route: "actionFlagHelp", module: string, action: string, flag: string }
	| { route: "stageEnvNotFound", stage: string, env: string }
	| { route: "globalFlagNotFound", flag: string }
	| { route: "moduleNotFound", module: string }
	| { route: "moduleFlagNotFound", module: string, flag: string }
	| { route: "actionNotSupported", module: string }
	| { route: "actionNotFound", module: string, action: string }
	| { route: "actionFlagNotFound", module: string, action: string, flag: string }
	| { route: "notAflagError", module: string, action: string, flag: string }
	| { route: "helpFlagConflictError" };

export type Snapshot = SnapshotFullContext<
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreTranslationsShape
>;
