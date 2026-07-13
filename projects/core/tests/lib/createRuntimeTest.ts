import { describe, it, expect } from "vitest";

import type { RuntimeTestSuite } from "./types";
import { CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreModulesShape, CoreStagesShape, CoreTranslationsShape, RuntimeAppShape } from "@types";

import {
	captureOutput,
	loadCLI,
	ProcessExitError,
	withArgsAndEnv,
	withTempEnvFile
} from "./helpers";


export function createRuntimeTests<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
	TSetup = unknown
>(
	suite: RuntimeTestSuite<
		TEvents,
		TChannels,
		TStages,
		TGlobals,
		TModules,
		TTranslations,
		TApp,
		TSetup
	>
) {
	describe(suite.describe, () => {

		for (const test of suite.tests) {

			it(test.name, async () => {

				const { CLI } = await loadCLI();

				const cli = CLI.init(
					suite.cli ?? {}
				);

				const setup =
					await suite.setup?.(cli);

				const { getOutput, restore } =
					captureOutput();

				try {

					const runCli = async () => {
						await withArgsAndEnv(
							test.args,
							test.envs,
							async () => {
								await cli.run();
							}
						);
					};

					if (test.envFile) {
						const content = test.envFile.content;
						const path = test.envFile.path;

						const execute = async () => {
							await withTempEnvFile(
								content,
								path,
								async () => {
									await runCli();
								}
							);
						};

						if (test.expectedExitCode) {
							await expect(execute())
								.rejects
								.toThrow(ProcessExitError);
						} else {
							await execute();
						}

					} else {

						if (test.expectedExitCode) {
							await expect(runCli)
								.rejects
								.toThrow(ProcessExitError);
						} else {
							await runCli();
						}
					}

					const output = getOutput();

					for (
						const expected of
						test.expectOutput ?? []
					) {
						expect(output)
							.toContain(expected);
					}

					await test.assert?.({
						output,
						setup
					});

				} finally {
					restore();
				}
			});
		}
	});
}
