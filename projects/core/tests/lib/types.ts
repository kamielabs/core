import { CLI } from "@kamie-oss/core";
import { CLIOptions, CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, RuntimeAppShape } from "@types";

export type RuntimeTest<TSetup = unknown> = {
	name: string;
	args?: string[];
	envs?: Record<string, string>;
	envFile?: { path: string; content: string; };
	expectedExitCode?: number;
	expectOutput?: string[];

	assert?: (ctx: {
		output: string;
		setup: TSetup | undefined;
	}) => void | Promise<void>;
};

export type RuntimeTestSuite<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
	TSetup = unknown
> = {
	describe: string;

	cli?: CLIOptions<
		TEvents,
		TChannels,
		TStages,
		TGlobals,
		TModules,
		TTranslations,
		TApp
	>;

	setup?: (
		cli: CLI<
			TEvents,
			TChannels,
			TStages,
			TGlobals,
			TModules,
			TTranslations,
			TApp
		>
	) => TSetup;

	tests: RuntimeTest<TSetup>[];
};
