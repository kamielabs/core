import { CLI } from "@kamie-oss/core";
import { CLIOptions, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape } from "@types";

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
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TSetup = unknown
> = {
	describe: string;

	cli?: CLIOptions<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	>;

	setup?: (
		cli: CLI<
			TEvents,
			TStages,
			TGlobals,
			TModules,
			TTranslations
		>
	) => TSetup;

	tests: RuntimeTest<TSetup>[];
};
