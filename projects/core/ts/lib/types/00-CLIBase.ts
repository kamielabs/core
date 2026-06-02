
/**
 * Primitive value shape accepted after CLI / env resolution.
 */
export type ParsedOptionValue = string | boolean | number | undefined;

/**
 * Generic engine execution state.
 */
export type EngineState = "idle" | "running" | "done" | "failed";

/**
 * Base declarative option shape shared by stages and globals.
 *
 * - `env` is the environment variable bound to the option
 * - `default` is the fallback value used before overrides
 * - `description` is optional descriptive metadata
 */
export interface Option<
	Env extends string,
	Default
> {
	env: Env;
	default: Default;
	description?: string;
}

/**
 * Infer the resolved value type of an `Option`.
 */
export type OptionValue<O> =
	O extends Option<string, infer Default>
	? Default
	: never;

/**
 * Shared CLI flag metadata.
 *
 * - `long` is the canonical long flag name
 * - `short` is the optional short alias
 * - `aliases` are additional accepted flag names
 * - `description` is optional descriptive metadata
 */
type BaseCLIFlag<Long extends string = string> = {
	long: Long;
	short?: string;
	aliases?: string[];
	description?: string;
};

/**
 * CLI flag variant that requires a user-provided value.
 *
 * `valueHint` is descriptive only and documents the expected input shape.
 */
export type CLIFlagWithValue<Long extends string = string> =
	BaseCLIFlag<Long> & {
		valueHint: string;
		value?: never;
	};

/**
 * CLI flag variant that resolves to a fixed preset value.
 *
 * This form is typically used for boolean-like toggles or hardcoded shortcuts.
 */
export type CLIFlagWithPreset<
	Long extends string = string,
	T = ParsedOptionValue
> = BaseCLIFlag<Long> & {
	valueHint?: never;
	value: T;
};

/**
 * Declarative CLI flag union supported by the parser.
 *
 * A flag can either:
 * - require a user value
 * - inject a preset runtime value
 */
export type CLIFlag<
	Long extends string = string,
	T = ParsedOptionValue
> =
	| CLIFlagWithValue<Long>
	| CLIFlagWithPreset<Long, T>;

/**
 * Global option shape.
 *
 * Global options extend base options with optional CLI bindings.
 */
export interface GlobalOption<Env extends string, Default> extends Option<Env, Default> {
	cli?: CLIFlag[];
}

/**
 * Infer the resolved value type of a `GlobalOption`.
 */
export type GlobalOptionValue<O> =
	O extends GlobalOption<string, infer Default>
	? Default
	: never;

// Module and Action Flags types
/**
 * Declarative module-level flag.
 *
 * `__type` is a typing helper only and is not used at runtime.
 */
export type ModuleFlag<
	Long extends string = string,
	T = ParsedOptionValue
> = CLIFlag<Long, T> & {
	__type?: T;
};

/**
 * Declarative action-level flag.
 *
 * `__type` is a typing helper only and is not used at runtime.
 */
export type ActionFlag<
	Long extends string = string,
	T = ParsedOptionValue
> = CLIFlag<Long, T> & {
	__type?: T;
};

/**
 * Canonical CoreError names currently supported by the core.
 */
export type CoreErrorName =
	| 'CORE_CLI_DUPLICATE_INSTANCE'
	| 'CORE_EVENTS_RESERVED_NAMESPACE'
	| 'CORE_EVENTS_INVALID_KEY'
	| 'CORE_EVENTS_DUPLICATE_KEY'
	| 'CORE_EVENTS_DUPLICATE_NAME'
	| 'CORE_STAGE_FILE_DUPLICATE'
	| 'CORE_STAGE_PROP_DUPLICATE'
	| 'CORE_STAGE_FILE_MISSING'
	| 'CORE_STAGE_LANG_MISSING'
	| 'CORE_I18N_RESERVED_NAMESPACE'
	| 'CORE_I18N_DUPLICATE_MESSAGE'
	| 'CORE_I18N_INVALID_KEY'
	| 'CORE_GLOBALS_RESERVED_NAMESPACE'
	| 'CORE_MODULES_RESERVED_NAMESPACE'
	| 'CORE_UNKNOWN_ERROR';

/**
 * Canonical CoreError codes currently supported by the core.
 */
export type CoreErrorCode =
	| 'F00001' // CLI_INSTANCE_DUPLICATE
	| 'F00100' // EVENT_RESERVED_NAMESPACE
	| 'F00101' // EVENT_INVALID_KEY
	| 'F00102' // EVENT_DUPLICATE_KEY
	| 'F00103' // EVENT_DUPLICATE_NAME
	| 'F00300' // STAGE_FILE_DUPLICATE
	| 'F00301' // STAGE_PROP_DUPLICATE
	| 'F00302' // STAGE_FILE_MISSING
	| 'F00303' // STAGE_LANG_MISSING
	| 'F00400' // I18N_RESERVED_NAMESPACE
	| 'F00401' // I18N_MESSAGE_DUPLICATE
	| 'F00402' // I18N_INVALID_KEY
	| 'F00500' // GLOBALS_RESERVED_NAMESPACE
	| 'F00700' // MODULES_RESERVED_NAMESPACE
	| 'F99999' // UNKNOWN_ERROR
	;


/**
 * Structural dictionary shape used by the CoreError registry.
 *
 * The outer key is an internal programmatic key.
 * Each entry stores the public name, code and source metadata.
 */
export type CoreErrorsShape = {
	[CodeKey in string]: {
		name: CoreErrorName,
		code: CoreErrorCode,
		source: string,
	}
}

/**
 * CoreMetaShape
 *
 * Defines the metadata structure for:
 * - core (framework-level metadata)
 * - cli (user-level metadata)
 *
 * Notes:
 * - core metadata is controlled by the framework
 * - cli metadata is expected to be overridden by user configuration
 */
export type CoreMetaShape = {
	core: {
		version: string;
		build?: string;
		author: string;
		git?: string;
	},
	cli: {
		name?: string | undefined;
		version?: string | undefined;
		author?: string | undefined;
	}
}

