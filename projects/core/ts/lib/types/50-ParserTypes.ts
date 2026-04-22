import { CLIFlag, ParsedOptionValue } from "@types";

export type ParserPhase =
	| "init"
	| "globalFlags"
	| "module"
	| "moduleFlags"
	| "action"
	| "actionFlags"
	| "args"
	| "done";

export interface IndexedFlag {
	key: string;
	raw: string;
	kind: "long" | "short";
	optionName: string;
	groupName: string;
	cliOption: CLIFlag;
}

export interface FlagIndex {
	byKey: Record<string, IndexedFlag>;
}

export interface EnvIndexEntry {
	env: string;
	optionName: string;
	groupName: string;
}

export interface EnvIndex {
	byEnv: Record<string, EnvIndexEntry>;
}

export interface ParserIssue {
	code:
	| "UNKNOWN_FLAG"
	| "MISSING_FLAG_VALUE"
	| "UNEXPECTED_FLAG_VALUE"
	| "DUPLICATE_FLAG_IN_SCOPE"
	| "INVALID_SHORT_GROUP"
	| "MODULE_MISSING"
	| "ACTION_MISSING";
	message: string;
	token?: string;
}

export interface ParsedFlagMeta {
	groupName: string;
	optionName: string;
}

export type ParsedFlagToken =
	| {
		kind: "unknown";
		token: string;
		issues: ParserIssue[];
	}
	| {
		kind: "single";
		token: string;
		entry: IndexedFlag;
		value?: string;
		issues: ParserIssue[];
	}
	| {
		kind: "group";
		token: string;
		entries: Array<{
			entry: IndexedFlag;
			value?: string;
		}>;
		issues: ParserIssue[];
	};

export type FlagRuntimeKeyMode = "long" | "optionName";

export interface FlagsPhaseResult {
	cursor: number;
	stopParsing: boolean;
	values: Record<string, ParsedOptionValue>;
	meta: Record<string, ParsedFlagMeta>;
	issues: ParserIssue[];
}

export interface KeywordPhaseResult {
	cursor: number;
	stopParsing: boolean;
	value?: string;
	issues: ParserIssue[];
}

export interface ArgsPhaseResult {
	cursor: number;
	args: string[];
}
