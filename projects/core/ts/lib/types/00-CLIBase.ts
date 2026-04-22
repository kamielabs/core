
export type ParsedOptionValue = string | boolean | number | undefined;
export type EngineState = "idle" | "running" | "done" | "failed";

export interface Option<
	Env extends string,
	Default
> {
	env: Env;
	default: Default;
	description?: string;
}

export type OptionValue<O> =
	O extends Option<string, infer Default>
	? Default
	: never;

type BaseCLIFlag<Long extends string = string> = {
	long: Long;
	short?: string;
	aliases?: string[];
	description?: string;
};

export type CLIFlagWithValue<Long extends string = string> =
	BaseCLIFlag<Long> & {
		valueHint: string;
		value?: never;
	};

export type CLIFlagWithPreset<
	Long extends string = string,
	T = ParsedOptionValue
> = BaseCLIFlag<Long> & {
	valueHint?: never;
	value: T;
};

export type CLIFlag<
	Long extends string = string,
	T = ParsedOptionValue
> =
	| CLIFlagWithValue<Long>
	| CLIFlagWithPreset<Long, T>;

export interface GlobalOption<Env extends string, Default> extends Option<Env, Default> {
	cli?: CLIFlag[];
}

export type GlobalOptionValue<O> =
	O extends GlobalOption<string, infer Default>
	? Default
	: never;

// Module and Action Flags types
export type ModuleFlag<
	Long extends string = string,
	T = ParsedOptionValue
> = CLIFlag<Long, T> & {
	__type?: T;
};

export type ActionFlag<
	Long extends string = string,
	T = ParsedOptionValue
> = CLIFlag<Long, T> & {
	__type?: T;
};

