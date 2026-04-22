
export const CORE_ERROR_TYPES = {
	CLI_INSTANCE_DUPLICATED: "CLI_INSTANCE_DUPLICATED",
	UNHANDLED_ERROR: "UNHANDLED_ERROR",
	// etc...
} as const;




export const CORE_ERRORS = {
	CLI_INSTANCE_DUPLICATED: {
		desc: "CLI is already initialized"
	},
	// ...
} as const;
