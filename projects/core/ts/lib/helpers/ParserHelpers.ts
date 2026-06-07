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
	FlagsPhaseResult,
	KeywordPhaseResult,
	ArgsPhaseResult,
	ParsedFlagToken,
	FlagRuntimeKeyMode,
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreTranslationsShape,
} from "@types";
import { ParsedOptionValue } from "@types";
import { Context } from "@contexts";

export class ParserHelpers<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private readonly _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;

	constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		this._ctx = ctx;
	};

	/**
	 * Safe typed hasOwnProperty
	 */
	public hasOwn<
		O extends object,
		K extends PropertyKey
	>(obj: O, key: K): key is Extract<K, keyof O> {
		return Object.prototype.hasOwnProperty.call(obj, key);
	};


	/**
	 * Resolves the stored value for a flag
	 *
	 * Rules:
	 * - valueHint → user must provide value → return userValue
	 * - value     → static value → return cli.value
	 * - otherwise → undefined (flag ignored at runtime level)
	 */
	public resolveFlagStoredValue(entry: IndexedFlag, userValue?: string): ParsedOptionValue | undefined {
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
	public async parseLongFlagToken(token: string, index: FlagIndex): Promise<ParsedFlagToken> {
		const eqIndex = token.indexOf("=");
		const rawKey = eqIndex === -1 ? token : token.slice(0, eqIndex);
		const value = eqIndex === -1 ? undefined : token.slice(eqIndex + 1);

		const entry = index.byKey[rawKey];

		const phase = this._ctx.parser.getPhase();
		const scope = phase === 'globalFlags' ? 'globals' : phase === 'moduleFlags' ? 'module' : 'action';

		if (!entry) {
			switch (phase) {
				case 'globalFlags':
					await this._ctx.events.warn('parserUnknownGlobalFlag', { values: { flag: rawKey, scope } });
					break;
				case 'moduleFlags':
					await this._ctx.events.warn('parserUnknownModuleFlag', { values: { flag: rawKey, scope } });
					break;
				case 'actionFlags':
					await this._ctx.events.warn('parserUnknownActionFlag', { values: { flag: rawKey, scope } });
					break;
				default: break;
			}
			return {
				kind: "unknown",
				token,
			};
		}

		const cli = entry.cliOption;

		if ("valueHint" in cli && cli.valueHint !== undefined) {
			if (value === undefined) {
				await this._ctx.events.warn('parserMissingFlagValue', { values: { flag: rawKey, scope } });
			}
		} else if ("value" in cli) {
			if (value !== undefined) {
				await this._ctx.events.warn('parserUnexpectedFlagValue', { values: { flag: rawKey, scope } });
			}
		}

		if (value !== undefined) {
			return {
				kind: "single",
				token,
				entry,
				value
			}
		}
		else {
			return {
				kind: "single",
				token,
				entry
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
	public async parseShortFlagToken(token: string, index: FlagIndex): Promise<ParsedFlagToken> {
		const body = token.slice(1);

		const phase = this._ctx.parser.getPhase();
		const scope = phase === 'globalFlags' ? 'globals' : phase === 'moduleFlags' ? 'module' : 'action';

		if (body.length === 0) {
			switch (phase) {
				case 'globalFlags':
					await this._ctx.events.warn('parserUnknownGlobalFlag', { values: { flag: token, scope } });
					break;
				case 'moduleFlags':
					await this._ctx.events.warn('parserUnknownModuleFlag', { values: { flag: token, scope } });
					break;
				case 'actionFlags':
					await this._ctx.events.warn('parserUnknownActionFlag', { values: { flag: token, scope } });
					break;
				default: break;
			}
			return {
				kind: "unknown",
				token
			};
		}

		// cas simple -x=value
		if (body.length >= 2 && body[1] === "=") {
			const rawKey = `-${body[0]}`;
			const value = body.slice(2);
			const entry = index.byKey[rawKey];


			if (!entry) {
				switch (phase) {
					case 'globalFlags':
						await this._ctx.events.warn('parserUnknownGlobalFlag', { values: { flag: token, scope } });
						break;
					case 'moduleFlags':
						await this._ctx.events.warn('parserUnknownModuleFlag', { values: { flag: token, scope } });
						break;
					case 'actionFlags':
						await this._ctx.events.warn('parserUnknownActionFlag', { values: { flag: token, scope } });
						break;
					default: break;
				}
				return {
					kind: "unknown",
					token
				};
			}

			const cli = entry.cliOption;

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				// ok
			} else {
				await this._ctx.events.warn('parserUnexpectedFlagValue', { values: { flag: rawKey, scope } });
			}

			return {
				kind: "single",
				token,
				entry,
				value
			};
		}

		// cas simple -x
		if (body.length === 1) {
			const rawKey = `-${body}`;
			const entry = index.byKey[rawKey];

			if (!entry) {
				switch (phase) {
					case 'globalFlags':
						await this._ctx.events.warn('parserUnknownGlobalFlag', { values: { flag: token, scope } });
						break;
					case 'moduleFlags':
						await this._ctx.events.warn('parserUnknownModuleFlag', { values: { flag: token, scope } });
						break;
					case 'actionFlags':
						await this._ctx.events.warn('parserUnknownActionFlag', { values: { flag: token, scope } });
						break;
					default: break;
				}

				return {
					kind: "unknown",
					token
				};
			}

			const cli = entry.cliOption;

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				await this._ctx.events.warn('parserMissingFlagValue', { values: { flag: token, scope } });
			}

			return {
				kind: "single",
				token,
				entry
			};
		}

		// short group: -abc or -abf=value
		const eqIndex = body.indexOf("=");
		const groupPart = eqIndex === -1 ? body : body.slice(0, eqIndex);
		const valuePart = eqIndex === -1 ? undefined : body.slice(eqIndex + 1);

		const entries: Array<{ entry: IndexedFlag; value?: string }> = [];

		for (let i = 0; i < groupPart.length; i++) {
			const char = groupPart[i];
			const rawKey = `-${char}`;
			const entry = index.byKey[rawKey];

			if (!entry) {
				switch (phase) {
					case 'globalFlags':
						await this._ctx.events.warn('parserUnknownGlobalFlag', { values: { flag: `${rawKey} in group "${token}"`, scope } });
						break;
					case 'moduleFlags':
						await this._ctx.events.warn('parserUnknownModuleFlag', { values: { flag: `${rawKey} in group "${token}"`, scope } });
						break;
					case 'actionFlags':
						await this._ctx.events.warn('parserUnknownActionFlag', { values: { flag: `${rawKey} in group "${token}"`, scope } });
						break;
					default: break;
				}
				continue;
			}

			const isLast = i === groupPart.length - 1;
			const cli = entry.cliOption;

			if ("valueHint" in cli && cli.valueHint !== undefined) {
				if (!isLast) {
					await this._ctx.events.warn('parserInvalidShortGroup', { values: { flag: rawKey, scope } });
					entries.push({ entry });
					continue;
				}

				if (valuePart === undefined) {
					await this._ctx.events.warn('parserMissingFlagValue', { values: { flag: rawKey, scope } });
					entries.push({ entry });
					continue;
				}

				entries.push({ entry, value: valuePart });
				continue;
			}

			if ("value" in cli) {
				if (isLast && valuePart !== undefined) {
					await this._ctx.events.warn('parserUnexpectedFlagValue', { values: { flag: token, scope } });
				}

				entries.push({ entry });
				continue;
			}

			entries.push({ entry });
		}

		return {
			kind: "group",
			token,
			entries
		};
	}

	/**
	 * Dispatch helper
	 */
	public async parseFlagToken(token: string, index: FlagIndex): Promise<ParsedFlagToken> {
		if (token.startsWith("--")) {
			return await this.parseLongFlagToken(token, index);
		}

		return await this.parseShortFlagToken(token, index);
	}

	/**
	 * Applies a parsed flag into runtime storage
	 *
	 * Handles:
	 * - duplicate detection
	 * - value resolution
	 * - metadata tracking
	 */
	public async applyFlag(
		entry: IndexedFlag,
		value: string | undefined,
		values: Record<string, ParsedOptionValue>,
		meta: Record<string, ParsedFlagMeta>,
		token: string,
		keyMode: FlagRuntimeKeyMode
	) {
		const runtimeKey =
			keyMode === "optionName"
				? entry.optionName
				: entry.cliOption.long;
		const optionName = entry.optionName;

		const phase = this._ctx.parser.getPhase();
		const scope = phase === 'globalFlags' ? 'globals' : phase === 'moduleFlags' ? 'module' : 'action';

		if (this.hasOwn(values, runtimeKey)) {
			await this._ctx.events.warn('parserDuplicateFlag', { values: { flag: token, opt: optionName, scope } });
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
	public async parseFlagsPhase(
		tokens: string[],
		startCursor: number,
		index: FlagIndex,
		keyMode: FlagRuntimeKeyMode
	): Promise<FlagsPhaseResult> {
		const values: Record<string, ParsedOptionValue> = {};
		const meta: Record<string, ParsedFlagMeta> = {};

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

			const parsed = await this.parseFlagToken(token, index);

			if (parsed.kind === "single") {
				await this.applyFlag(parsed.entry, parsed.value, values, meta, token, keyMode);
			}

			if (parsed.kind === "group") {
				for (const item of parsed.entries) {
					await this.applyFlag(item.entry, item.value, values, meta, token, keyMode);
				}
			}

			cursor++;
			// Hardcoded help and version detection
			const hasHelp = values["help"] === true;
			const hasVersion = values["version"] === true;
			if (hasHelp || hasVersion) {
				stopParsing = true;
				break;
			}
		}

		return {
			cursor,
			stopParsing,
			values,
			meta
		};
	}

	/**
	 * Keyword phase (module / action)
	 */
	public async parseKeywordPhase(
		tokens: string[],
		startCursor: number,
		code: "MODULE_MISSING" | "ACTION_MISSING",
		exists?: (keyword: string) => boolean
	): Promise<KeywordPhaseResult> {
		let cursor = startCursor;
		let stopParsing = false;

		if (cursor >= tokens.length) {
			if (code === "MODULE_MISSING") await this._ctx.events.warn('parserMissingModule');
			else await this._ctx.events.warn('parserMissingAction', { values: { module: this._ctx.parser.getDraft().context.module! } });
			return { cursor, stopParsing };
		}

		const token = tokens[cursor];
		if (!token) {
			stopParsing = true;
			cursor++;
			if (code === "MODULE_MISSING") await this._ctx.events.warn('parserMissingModule');
			else await this._ctx.events.warn('parserMissingAction', { values: { module: this._ctx.parser.getDraft().context.module! } });
			return { cursor, stopParsing };
		}

		if (token === "--") {
			stopParsing = true;
			cursor++;
			if (code === "MODULE_MISSING") await this._ctx.events.warn('parserMissingModule');
			else await this._ctx.events.warn('parserMissingAction', { values: { module: this._ctx.parser.getDraft().context.module! } });
			return { cursor, stopParsing };
		}

		if (token.startsWith("-")) {
			if (code === "MODULE_MISSING") await this._ctx.events.warn('parserMissingModule');
			else await this._ctx.events.warn('parserMissingAction', { values: { module: this._ctx.parser.getDraft().context.module! } });
			return { cursor, stopParsing };
		}

		if (exists && !exists(token)) {
			if (code === "MODULE_MISSING") await this._ctx.events.warn('parserUnknownModule', { values: { module: token } });
			else await this._ctx.events.warn('parserUnknownAction', {
				values: {
					module: this._ctx.parser.getDraft().context.module!,
					action: token
				}
			});
		}

		cursor++;

		return {
			cursor,
			stopParsing,
			value: token
		};
	}

	/**
	 * Args phase
	 *
	 * Collects all remaining tokens as raw args
	 */
	public collectArgsPhase(
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
