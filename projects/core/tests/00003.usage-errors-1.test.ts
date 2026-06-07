import { outputs } from "./lib/outputs";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Usage Errors Tests",
	cli: {
		modules: {
			test: {
				description: "Test Module for VITESTS",
				actions: {
					test1: {
						description: "First Test Action for VITESTS"
					},
					test2: {
						description: "Second Test Action for VITESTS"
					}
				}
			}

		}
	},
	tests: [
		{
			name: "should fallback to usage error on unknown global flag",
			args: ["-u", "test", "test1"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownGlobalFlagError, outputs.globalsHelpUsage]
		}, {
			name: "should fallback to usage error on unknown module",
			args: ["unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleError, outputs.modulesHelpUsage]
		}, {
			name: "should fallback to usage error on unknown module flag",
			args: ["test", "-u", "test1"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleFlagError, outputs.moduleHelpUsage]
		}, {
			name: "should fallback to usage error on unknown action",
			args: ["test", "unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownActionError, outputs.moduleHelpUsage]
		}, {
			name: "should fallback to usage error on unknown action flag",
			args: ["test", "test1", "-u"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownActionFlagError, outputs.actionHelpUsage]
		}
	]
});
