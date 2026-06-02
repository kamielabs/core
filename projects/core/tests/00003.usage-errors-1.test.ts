import { outputs } from "./lib/outputs";
import { createRuntimeTests } from "./lib/createRuntimeTest";

createRuntimeTests({
	describe: "Usage Errors Tests",
	tests: [
		{
			name: "should fallback to usage error on unknown module",
			args: ["unknown"],
			expectedExitCode: 1,
			expectOutput: [outputs.unknownModuleError, outputs.fullHelpUsage]
		}
	]
})
