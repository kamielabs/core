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


export interface ParsedFlagMeta {
	groupName: string;
	optionName: string;
}

export type ParsedFlagToken =
	| {
		kind: "unknown";
		token: string;
	}
	| {
		kind: "single";
		token: string;
		entry: IndexedFlag;
		value?: string;
	}
	| {
		kind: "group";
		token: string;
		entries: Array<{
			entry: IndexedFlag;
			value?: string;
		}>;
	};

export type FlagRuntimeKeyMode = "long" | "optionName";

export interface FlagsPhaseResult {
	cursor: number;
	stopParsing: boolean;
	values: Record<string, ParsedOptionValue>;
	meta: Record<string, ParsedFlagMeta>;
}

export interface KeywordPhaseResult {
	cursor: number;
	stopParsing: boolean;
	value?: string;
}

export interface ArgsPhaseResult {
	cursor: number;
	args: string[];
}

// Parser Usage Routes Types
export type CLIHelpMode = "single" | 'modular';
export type FlagScope = "global" | "module" | "action";

export type UsageRoute = "fullUsage" | "moduleUsage" | "actionUsage" | "flagUsage";
