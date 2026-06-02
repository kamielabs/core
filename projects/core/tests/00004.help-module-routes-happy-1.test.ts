import { outputs } from "./lib/outputs";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Help Module Routes Happy Validation 1",
	tests: [
		{
			name: "should show normal help",
			args: ["--help"],
			expectOutput: [outputs.normalHelp]
		}, {
			name: "should show full help",
			args: ["--help", "-F"],
			expectOutput: [outputs.fullHelp]
		}, {
			name: "should show all stage options help",
			args: ["--help", "-S"],
			expectOutput: [outputs.allStageOptionsHelp]
		}, {
			name: "should show all global options help",
			args: ["--help", "-G"],
			expectOutput: [outputs.allGlobalOptionsHelp]
		}, {
			name: "should show all modules help",
			args: ["--help", "-M"],
			expectOutput: [outputs.allModulesHelp]
		}, {
			name: "should show stage option details",
			args: ["--help", "-s=NODE_CLI_LANG"],
			expectOutput: [outputs.stageOptionHelp]
		}, {
			name: "should show global option details (flag)",
			args: ["--help", "-g=--help"],
			expectOutput: [outputs.globalFlagHelp]
		}, {
			name: "should show global option details (env_var)",
			args: ["--help", "-g=_NODE_CLI_HELP"],
			expectOutput: [outputs.globalEnvVarHelp]
		}, {
			name: "should show module default action help",
			args: ["--help", "help"],
			expectOutput: [outputs.moduleDefaultActionHelp]
		}, {
			name: "should show module default action flag help",
			args: ["--help", "help", "-f"],
			expectOutput: [outputs.moduleDefaultActionFlagHelp]
		}
	]
});

createRuntimeTests({
	describe: "Help Module Routes Happy Validation 2",
	cli: {
		modules: {
			test: {
				description: "Test Module for VITESTS",
				options: {
					full: {
						long: "full",
						short: "f",
						value: "full"
					}
				},
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
			name: "should show help for module 'test'",
			args: ["--help", "test"],
			expectOutput: [outputs.moduleHelp]
		}, {
			name: "should show help for action test1 of module 'test'",
			args: ["--help", "test", "test1"],
			expectOutput: [outputs.moduleActionHelp]
		}
	]
})

