// NOTE:
// - ParsingHelpers is the core CLI parsing engine (low-level)
// - Implements a deterministic, single-pass, left-to-right parser
// - All parsing is position-based using a cursor system

// WARNING:
// - This file is CRITICAL to core behavior (do not modify lightly)
// - Assumes all indexes (FlagIndex, ActionIndex, etc.) are VALID
// - No validation is done here — Managers are responsible for that
// - Errors are accumulated (ParserIssue[]) instead of thrown

// PARSING MODEL:
// 1. Flags phase       → parseFlagsPhase()
// 2. Keyword phase     → parseKeywordPhase()
// 3. Args phase        → collectArgsPhase()
//
// STOP TOKEN:
// - "--" stops flag parsing and switches phase

// FLAG RULES:
// - Long flags: --flag or --flag=value
// - Short flags: -f, -f=value
// - Groups: -abc, -abf=value
//   → Only LAST flag can accept a value
//   → Value-required flags cannot appear before end

// TODO: ARCHITECTURE — Integrate into ctx.helpers.* (context-bound helpers)

import {
	FlagIndex,
	IndexedFlag,
	ParsedFlagMeta,
	ParserIssue,
	FlagsPhaseResult,
	KeywordPhaseResult,
	ArgsPhaseResult,
	ParsedFlagToken,
	FlagRuntimeKeyMode,
} from "@types";
import { ParsedOptionValue } from "@types";

export class ParsingHelpers {

	constructor() { };

	/**
	 * Safe typed hasOwnProperty
	 */
	public static hasOwn<
		O extends object,
		K extends PropertyKey
	>(obj: O, key: K): key is Extract<K, keyof O> {
		return Object.prototype.hasOwnProperty.call(obj, key);
	};

	/**
	 * Builds a ParserIssue object
	 * Used everywhere to accumulate parsing errors
	 */
	public static buildIssue(
		code: ParserIssue["code"],
		message: string,
		token?: string
	): ParserIssue {
		if (token) return { code, message, token }
		else return { code, message };
	};

	/**
	 * Resolves the stored value for a flag
	 *
	 * Rules:
	 * - valueHint → user must provide value → return userValue
	 * - value     → static value → return cli.value
	 * - otherwise → undefined (flag ignored at runtime level)
	 */
	public static resolveFlagStoredValue(entry: IndexedFlag, userValue?: string): ParsedOptionValue | undefined {
		const cli = entry.cliOption;

		if ("valueHint" in cli && cli.valueHint !== undefined) {
			return userValue;
		}

		if ("value" in cli) {
			return cli.value;
		}

		return undefined;
	}

	/**
	 * Parses a long flag token
	 *
	 * Supported:
	 * - --flag
	 * - --flag=value
	 *
	 * Steps:
	 * 1. Split key/value
	 * 2. Lookup index
	 * 3. Validate value rules
	 * 4. Return structured token
	 */
	public static parseLongFlagToken(token: string, index: FlagIndex): ParsedFlagToken {
		const eqIndex = token.indexOf("=");
		const rawKey = eqIndex === -1 ? token : token.slice(0, eqIndex);
		const value = eqIndex === -1 ? undefined : token.slice(eqIndex + 1);

		const entry = index.byKey[rawKey];

		if (!entry) {
			return {
				kind: "unknown",
				token,
				issues: [
					this.buildIssue("UNKNOWN_FLAG", `Unknown flag "${rawKey}" in current scope`, token)
				]
			};
		}

		const cli = entry.cliOption;
		const issues: ParserIssue[] = [];

		if ("valueHint" in cli && cli.valueHint !== undefined) {
			if (value === undefined) {
				issues.push(
					this.buildIssue("MISSING_FLAG_VALUE", `Flag "${rawKey}" requires a value`, token)
				);
			}
		} else if ("value" in cli) {
			if (value !== undefined) {
				issues.push(
					this.buildIssue("UNEXPECTED_FLAG_VALUE", `Flag "${rawKey}" does not accept a user value`, token)
				);
			}
		}

		if (value !== undefined) {
			return {
				kind: "single",
				token,
				entry,
				value,
				issues
			}
		}
		else {
			return {
				kind: "single",
				token,
				entry,
				issues
			}
		}
	}

	/**
	 * Parses short flags
	 *
	 * Supported:
	 * - -x
	 * - -x=value
	 * - -abc (group)
	 * - -abx=value
	 *
	 * Important rules:
	 * - Only last flag can receive value
	 * - valueHint flags must be last
	 */
	public static parseShortFlagToken(token: string, index: FlagIndex): ParsedFlagToken {
		const body = token.slice(1);

		if (body.length === 0) {
			return {
				kind: "unknown",
				token,
				issues: [
					this.buildIssue("UNKNOWN_FLAG", `Invalid short flag token "${token}"`, token)
				]
			};
		}

		// cas simple -x=value
		if (body.length >= 2 && body[1] === "=") {
			const rawKey = `-${body[0]}`;
			const value = body.slice(2);
			const entry = index.byKey[rawKey];

			if (!entry) {
				return {
					kind: "unknown",
					token,
					issues: [
						this.buildIssue("UNKNOWN_FLAG", `Unknown flag "${rawKey}" in current scope`, token)
					]
				};
			}

			const cli = entry.cliOption;
			const issues: ParserIssue[] = [];

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				// ok
			} else {
				issues.push(
					this.buildIssue("UNEXPECTED_FLAG_VALUE", `Flag "${rawKey}" does not accept a user value`, token)
				);
			}

			return {
				kind: "single",
				token,
				entry,
				value,
				issues
			};
		}

		// cas simple -x
		if (body.length === 1) {
			const rawKey = `-${body}`;
			const entry = index.byKey[rawKey];

			if (!entry) {
				return {
					kind: "unknown",
					token,
					issues: [
						this.buildIssue("UNKNOWN_FLAG", `Unknown flag "${rawKey}" in current scope`, token)
					]
				};
			}

			const cli = entry.cliOption;
			const issues: ParserIssue[] = [];

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				issues.push(
					this.buildIssue("MISSING_FLAG_VALUE", `Flag "${rawKey}" requires a value`, token)
				);
			}

			return {
				kind: "single",
				token,
				entry,
				issues
			};
		}

		// short group: -abc or -abf=value
		const eqIndex = body.indexOf("=");
		const groupPart = eqIndex === -1 ? body : body.slice(0, eqIndex);
		const valuePart = eqIndex === -1 ? undefined : body.slice(eqIndex + 1);

		const entries: Array<{ entry: IndexedFlag; value?: string }> = [];
		const issues: ParserIssue[] = [];

		for (let i = 0; i < groupPart.length; i++) {
			const char = groupPart[i];
			const rawKey = `-${char}`;
			const entry = index.byKey[rawKey];

			if (!entry) {
				issues.push(
					this.buildIssue("UNKNOWN_FLAG", `Unknown flag "${rawKey}" in current scope`, token)
				);
				continue;
			}

			const isLast = i === groupPart.length - 1;
			const cli = entry.cliOption;

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				if (!isLast) {
					issues.push(
						this.buildIssue(
							"INVALID_SHORT_GROUP",
							`Flag "${rawKey}" requires a value and cannot appear before the end of a short group`,
							token
						)
					);
					entries.push({ entry });
					continue;
				}

				if (valuePart === undefined) {
					issues.push(
						this.buildIssue("MISSING_FLAG_VALUE", `Flag "${rawKey}" requires a value`, token)
					);
					entries.push({ entry });
					continue;
				}

				entries.push({ entry, value: valuePart });
				continue;
			}

			if ("value" in cli) {
				if (isLast && valuePart !== undefined) {
					issues.push(
						this.buildIssue(
							"UNEXPECTED_FLAG_VALUE",
							`Flag "${rawKey}" does not accept a user value`,
							token
						)
					);
				}

				entries.push({ entry });
				continue;
			}

			entries.push({ entry });
		}

		return {
			kind: "group",
			token,
			entries,
			issues
		};
	}

	/**
	 * Dispatch helper
	 */
	public static parseFlagToken(token: string, index: FlagIndex): ParsedFlagToken {
		if (token.startsWith("--")) {
			return this.parseLongFlagToken(token, index);
		}

		return this.parseShortFlagToken(token, index);
	}

	/**
	 * Applies a parsed flag into runtime storage
	 *
	 * Handles:
	 * - duplicate detection
	 * - value resolution
	 * - metadata tracking
	 */
	public static applyFlag(
		entry: IndexedFlag,
		value: string | undefined,
		values: Record<string, ParsedOptionValue>,
		meta: Record<string, ParsedFlagMeta>,
		issues: ParserIssue[],
		token: string,
		keyMode: FlagRuntimeKeyMode
	) {
		const runtimeKey =
			keyMode === "optionName"
				? entry.optionName
				: entry.cliOption.long;
		const optionName = entry.optionName;

		if (this.hasOwn(values, runtimeKey)) {
			issues.push(
				this.buildIssue(
					"DUPLICATE_FLAG_IN_SCOPE",
					`Duplicate flag for option "${optionName}" in current scope`,
					token
				)
			);
			return;
		}

		const resolvedValue = this.resolveFlagStoredValue(entry, value);

		if (resolvedValue === undefined) {
			return;
		}

		values[runtimeKey] = resolvedValue;
		meta[runtimeKey] = {
			groupName: entry.groupName,
			optionName: entry.optionName
		};
	}

	/**
	 * Flags phase parser
	 *
	 * Iterates until:
	 * - non-flag token
	 * - "--" stop token
	 */
	public static parseFlagsPhase(
		tokens: string[],
		startCursor: number,
		index: FlagIndex,
		keyMode: FlagRuntimeKeyMode
	): FlagsPhaseResult {
		const values: Record<string, ParsedOptionValue> = {};
		const meta: Record<string, ParsedFlagMeta> = {};
		const issues: ParserIssue[] = [];

		let cursor = startCursor;
		let stopParsing = false;

		while (cursor < tokens.length) {
			const token = tokens[cursor];
			if (!token) {
				cursor++;
				continue;
			}

			if (token === "--") {
				stopParsing = true;
				cursor++;
				break;
			}

			if (!token.startsWith("-")) {
				break;
			}

			const parsed = this.parseFlagToken(token, index);
			issues.push(...parsed.issues);

			if (parsed.kind === "single") {
				this.applyFlag(parsed.entry, parsed.value, values, meta, issues, token, keyMode);
			}

			if (parsed.kind === "group") {
				for (const item of parsed.entries) {
					this.applyFlag(item.entry, item.value, values, meta, issues, token, keyMode);
				}
			}

			cursor++;
		}

		return {
			cursor,
			stopParsing,
			values,
			meta,
			issues
		};
	}

	/**
	 * Keyword phase (module / action)
	 */
	public static parseKeywordPhase(
		tokens: string[],
		startCursor: number,
		code: "MODULE_MISSING" | "ACTION_MISSING",
		exists?: (keyword: string) => boolean
	): KeywordPhaseResult {
		let cursor = startCursor;
		const issues: ParserIssue[] = [];
		let stopParsing = false;

		if (cursor >= tokens.length) {
			issues.push(
				this.buildIssue(code, code === "MODULE_MISSING" ? "Module is missing" : "Action is missing")
			);
			return { cursor, stopParsing, issues };
		}

		const token = tokens[cursor];
		if (!token) {
			stopParsing = true;
			cursor++;
			issues.push(
				this.buildIssue(code, code === "MODULE_MISSING" ? "Module is missing" : "Action is missing", token)
			);
			return { cursor, stopParsing, issues };
		}

		if (token === "--") {
			stopParsing = true;
			cursor++;
			issues.push(
				this.buildIssue(code, code === "MODULE_MISSING" ? "Module is missing" : "Action is missing", token)
			);
			return { cursor, stopParsing, issues };
		}

		if (token.startsWith("-")) {
			issues.push(
				this.buildIssue(code, code === "MODULE_MISSING" ? "Module is missing" : "Action is missing", token)
			);
			return { cursor, stopParsing, issues };
		}

		if (exists && !exists(token)) {
			issues.push(
				this.buildIssue(code, `Unknown ${code === "MODULE_MISSING" ? "module" : "action"} "${token}"`, token)
			);
		}

		cursor++;

		return {
			cursor,
			stopParsing,
			value: token,
			issues
		};
	}

	/**
	 * Args phase
	 *
	 * Collects all remaining tokens as raw args
	 */
	public static collectArgsPhase(
		tokens: string[],
		startCursor: number
	): ArgsPhaseResult {
		const args: string[] = [];
		let cursor = startCursor;

		while (cursor < tokens.length) {
			const currentArg = tokens[cursor];
			if (currentArg !== undefined) {
				args.push(currentArg);
				cursor++;
			}
		}

		return {
			cursor,
			args
		};
	}
}
