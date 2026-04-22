import { CoreModulesShape } from "@types";

export const BUILTIN_MODULES = {
	help: {
		description: "Display help information",
		actions: {
			show: {
				description: "Show help",
				signature: ["[module]", "[action]"]
			}
		}
	},
	version: {
		description: "Show CLI version (and Core Build)",
		actions: {
			show: {
				description: "Show Version"
			}
		}
	}
} satisfies CoreModulesShape;

export type BuiltinModules = typeof BUILTIN_MODULES;
export type FinalModules<TModules extends CoreModulesShape> = BuiltinModules & TModules;
