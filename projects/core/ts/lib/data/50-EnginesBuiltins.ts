import { Engine } from "@abstracts";
import { Context } from "@contexts";
import { FedEngine, StandardEngine } from "@engines";
import { CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape } from "@types";



export type CoreEnginesShape<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = Record<
	string,
	new (
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		runner: () => Promise<void>
	) => Engine<TEvents, TStages, TGlobals, TModules, TTranslations>
>;

export const BUILTIN_ENGINES = {
	std: StandardEngine,
	fed: FedEngine
} as const;


export type CoreEngineName = keyof typeof BUILTIN_ENGINES;
// "std" | "fed"
