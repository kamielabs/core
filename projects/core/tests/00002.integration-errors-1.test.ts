import { outputs } from "./lib/outputs";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Integration Errors Tests",
	tests: [
		{
			name: "env file tests",
			args: ["unknown"],
			envFile: {
				path: ".env.test",
				content: "NODE_CLI_LANG=fr"
			},
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleError, outputs.fullHelpUsage]
		}
	]
});
