import { CoreModulesShape } from "@types";

export const BUILTIN_MODULES = {
	help: {
		description: "Display help information",
		defaultAction: {
			__defaultAction__: {
				description: "Show help",
				options: {
					fullHelp: {
						description: "Display Full Help",
						long: 'full',
						short: 'f',
						aliases: ["F", "all", "A"],
						value: true
					},
					allModules: {
						description: "Display all available modules",
						long: "modules-all",
						short: "M",
						value: true
					},
					stageOption: {
						description: "Display current stage option detail",
						long: "stage-env",
						short: "s",
						valueHint: "<STAGE_ENV_VAR>"
					},
					allStageOptions: {
						description: "Display current stage all options",
						long: "stage-envs-all",
						short: "S",
						value: true
					},
					globalOption: {
						description: "Display global option details",
						long: "global",
						short: 'g',
						valueHint: "<-f/--flag/GLOBAL_ENV_VAR>"
					},
					allGlobalOptions: {
						description: "Display all globals",
						long: "globals-all",
						short: "G",
						value: true
					}
				},
				argsHint: ["[module]", "<module> <action>", "<module> <--flag/-f>", "<module> <action> <--flag/-f>"]
			}
		}
	},
	version: {
		description: "Show CLI version (and Core Build)",
		defaultAction: {
			__defaultAction__: {
				description: "Show Version"
			}
		}
	}
} satisfies CoreModulesShape;

export type BuiltinModules = typeof BUILTIN_MODULES;
export type FinalModules<TModules extends CoreModulesShape> = BuiltinModules & TModules;
