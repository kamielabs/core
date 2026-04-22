import { CoreGlobalsShape, GlobalOption } from "@types";


export const GLOBAL_HELP_ENV = '_NODE_CLI_HELP';
export const GLOBAL_VERSION_ENV = '_NODE_CLI_VERSION';

const helpGlobal: GlobalOption<typeof GLOBAL_HELP_ENV, boolean> = {
	env: GLOBAL_HELP_ENV,
	default: false,
	description: "Show Help from Global Options",
	cli: [{
		long: "help",
		short: "h",
		value: true
	}]
}

const versionGlobal: GlobalOption<typeof GLOBAL_VERSION_ENV, boolean> = {
	env: GLOBAL_VERSION_ENV,
	default: false,
	description: "Show version from Global Options",
	cli: [{
		long: "version",
		short: "v",
		value: true
	}]
}

/*
	Builtin Global Options full dict
*/

export const BUILTIN_GLOBALS = {
	core: {
		help: helpGlobal,
		version: versionGlobal
	}
} as const satisfies CoreGlobalsShape
export type BuiltinGlobals = typeof BUILTIN_GLOBALS;
export type FinalGlobals<TGlobals extends CoreGlobalsShape> = BuiltinGlobals & TGlobals;
