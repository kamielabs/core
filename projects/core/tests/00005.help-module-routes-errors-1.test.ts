import { outputs } from "./lib/outputs";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Help Module Routes Error Validation",
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
			name: "should fallback to help usage error on unknown stage env var",
			args: ["help", "-s=UNKNOWN"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownStageEnvHelpError, outputs.stageEnvsHelpList]
		}, {
			name: "should fallback to help usage error on unknown global option/flag",
			args: ["help", "-g=-u"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownGlobalHelpError, outputs.globalsHelpList]
		}, {
			name: "should fallback to help usage error on unknown module",
			args: ["help", "unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleHelpError, outputs.modulesHelpList]
		}, {
			name: "should fallback to help usage error on unupported named action on default action module",
			args: ["help", "help", "unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unsupportedNamedActionHelpError, outputs.moduleHelpList]
		}, {
			name: "should fallback to help usage error on unknown action",
			args: ["help", "test", "unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownActionHelpError, outputs.moduleActionsHelpList]
		}, {
			name: "should fallback to help usage error on unknown module flag",
			args: ["help", "test", "-u"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleFlagHelpError, outputs.moduleFlagsHelpList]
		}, {
			name: "should fallback to help usage error on unknown action flag",
			args: ["help", "test", "test1", "-u"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownActionFlagHelpError, outputs.actionFlagsHelpList]
		}
	]
})
