import { ResolverManager } from "@abstracts";
import { Context } from "@contexts";

import {
	ParsingHelpers,
	ModulesHelpers
} from "@helpers";

import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	ParserPhase,
	FlagIndex,
	RuntimeCliContext,
	ParsedCliContextResult,
	ParserIssue,
	ModuleIndex,
	ActionIndex,
	CoreTranslationsShape
} from "@types";

/**
 * TODO: V0.1: Lot of things to do still to make this class perfect, but we keep it as it , only bugs if exists rn
 *
 * TODO: V2.0: Externalize ParserIssues to a new event kind (today we have signal, message), named parser
 *
 * TODO: V2.0: this event kind will be only internal, not customizable and only can be viewed in runtime events already done
 *
 * TODO: V2.0: it will allows to juste extend our system , keep a specific dict format for eventing parsingIssues, and even get a specific behavior for this kind in the eventsManager,
 */

/**
 * ParserManager
 *
 * Centralized CLI parsing engine.
 *
 * Responsibilities:
 * - Parse raw CLI tokens into structured runtime context
 * - Orchestrate parsing phases (globals → module → action → args)
 * - Delegate parsing logic to specialized helpers
 * - Collect parsing issues (non-fatal errors)
 * - Maintain parsing state (cursor, phase, stop flag)
 * - Produce ParsedCliContextResult
 *
 * Core design:
 * - Single-pass, left-to-right parsing
 * - Phase-driven parsing (strict lifecycle)
 * - Deterministic and predictable behavior
 * - No backtracking
 *
 * Parsing phases:
 * - init → initialization
 * - globalFlags → parse global CLI flags
 * - module → parse module keyword
 * - moduleFlags → parse module flags (if allowed)
 * - action → resolve action (default or explicit)
 * - actionFlags → parse action flags
 * - args → collect remaining arguments
 * - done → parsing complete
 *
 * Special behaviors:
 * - "--" stop token is handled by helpers (stopParsing flag)
 * - help/version flags shortcut parsing to args phase
 * - defaultAction modules skip module flags and action parsing
 *
 * Output structure:
 * - context → structured CLI input (globals, module, action, args)
 * - issues → non-fatal parsing errors
 * - ignored → tokens not processed (reserved for future use)
 *
 * Design principles:
 * - Strict separation of phases
 * - Helpers contain parsing logic, manager orchestrates flow
 * - No mutation after finalize()
 * - Errors during parsing are collected, not thrown
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class ParserManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends ResolverManager<
	ParsedCliContextResult,
	TEvents,
	TStages,
	TGlobals,
	TModules,
	TTranslations
> {

	/**
	 * Raw CLI tokens extracted from process arguments.
	 */
	private tokens: string[] = [];

	/**
	 * Current parsing cursor (index in tokens array).
	 */
	private cursor = 0;

	/**
	 * Current parser phase.
	 */
	private phase: ParserPhase = "init";

	/**
	 * Stop flag triggered by parsing helpers (e.g. "--").
	 */
	private stop = false;

	/**
	 * Accumulated parsing result.
	 *
	 * - context → parsed CLI structure
	 * - ignored → unused tokens
	 * - issues → non-fatal parsing problems
	 */
	private result: ParsedCliContextResult = {
		context: {},
		ignored: [],
		issues: []
	};

	/**
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>
	) {
		super(ctx);
	}

	// -----------------------------------------------------
	// INIT
	// -----------------------------------------------------

	/**
	 * Initialize parser state.
	 *
	 * Steps:
	 * - Emit parserInit event
	 * - Load CLI args from bootstrap
	 * - Reset cursor, stop flag, and result
	 * - Set phase to "globalFlags"
	 *
	 * This method must be called before any parsing phase.
	 */
	public resolve(): void | Promise<void> {

		this.ctx.events.internalEmit('parserInit');

		const bootstrap = this.ctx.bootstrap.getResolved();
		const args = bootstrap.script.args;

		this.tokens = [...args];
		this.cursor = 0;
		this.stop = false;

		this.result = {
			context: {},
			ignored: [],
			issues: []
		};

		this.phase = "globalFlags";
	}

	// -----------------------------------------------------
	// GLOBAL FLAGS
	// -----------------------------------------------------

	/**
	 * Parse global CLI flags.
	 *
	 * Behavior:
	 * - Uses flagIndex to resolve CLI flags
	 * - Groups values by global group
	 * - Stores results in context.globals
	 * - Collects parsing issues
	 *
	 * Special handling:
	 * - Detects "help" and "version" flags
	 * - Forces phase transition to "args" if detected
	 *
	 * Phase transition:
	 * - "globalFlags" → nextPhase OR "args"
	 *
	 * @param flagIndex - Global flags index
	 * @param nextPhase - Next phase ("module" or "args")
	 *
	 * @throws Error if called outside "globalFlags" phase
	 */
	public resolveGlobals(flagIndex: FlagIndex, nextPhase: 'module' | 'args' = 'module') {

		if (this.phase !== "globalFlags") {
			throw new Error("ParserManager: resolveGlobals() called in invalid phase.");
		}

		const parsed = ParsingHelpers.parseFlagsPhase(
			this.tokens,
			this.cursor,
			flagIndex,
			'optionName'
		);

		this.cursor = parsed.cursor;
		this.stop = parsed.stopParsing;

		const grouped: RuntimeCliContext["globals"] = {};

		for (const optionName in parsed.values) {

			const value = parsed.values[optionName];
			const meta = parsed.meta[optionName];

			if (!meta) continue;

			const { groupName } = meta;

			grouped[groupName] ??= {};
			grouped[groupName][optionName] = value;
		}

		this.result.context.globals = grouped;

		this.result.issues.push(...parsed.issues);

		// Hardcoded help and version detection
		const hasHelp = parsed.values["help"] === true;
		const hasVersion = parsed.values["version"] === true;

		if (hasHelp || hasVersion) {
			this.phase = "args";
		} else {
			this.phase = nextPhase;
		}
	}

	/**
	 * Finalize parsing directly to args phase.
	 *
	 * Used when parsing must skip module/action resolution.
	 *
	 * @throws Error if called outside "args" phase
	 */
	public finalizeArgsPhase() {
		if (this.phase !== "args") {
			throw new Error("ParserManager: finalizeArgsPhase() called in invalid phase.");
		}
		this._finalizeArgs();
		return;
	};

	// -----------------------------------------------------
	// MODULE / ACTION / ARGS
	// -----------------------------------------------------

	/**
	 * Resolve module, action, flags, and arguments.
	 *
	 * Full parsing flow:
	 * 1. Parse module keyword
	 * 2. Validate module existence
	 * 3. Parse module flags (if allowed)
	 * 4. Resolve action (default or explicit)
	 * 5. Parse action flags
	 * 6. Collect args
	 *
	 * Special behaviors:
	 * - Invalid module → immediate args fallback
	 * - defaultAction modules skip module flags and action parsing
	 * - stop flag terminates parsing early
	 *
	 * Phase transitions:
	 * - module → moduleFlags → action → actionFlags → args → done
	 *
	 * @param moduleIndex - Module lookup index
	 * @param actionIndex - Action lookup index
	 * @param moduleFlagIndex - Optional module flags index
	 * @param actionFlagIndex - Optional action flags index
	 *
	 * @throws Error if called outside "module" phase
	 */
	public resolveModule(
		moduleIndex: ModuleIndex,
		actionIndex: ActionIndex,
		moduleFlagIndex?: FlagIndex,
		actionFlagIndex?: FlagIndex
	) {

		if (this.phase !== "module") {
			throw new Error("ParserManager: resolveModule() called in invalid phase.");
		}

		// -------------------------------------------------
		// MODULE KEYWORD
		// -------------------------------------------------

		const moduleResult = ParsingHelpers.parseKeywordPhase(
			this.tokens,
			this.cursor,
			"MODULE_MISSING",
			(name) => ModulesHelpers.moduleExists(moduleIndex, name)
		);

		this.cursor = moduleResult.cursor;
		this.stop = moduleResult.stopParsing;

		this.result.issues.push(...moduleResult.issues);

		let moduleShape;

		if (moduleResult.value) {
			const resolved = ModulesHelpers.resolveModuleName(moduleIndex, moduleResult.value);
			this.result.context.module = resolved;
			moduleShape = moduleIndex.byName[resolved];
		}

		if (!moduleShape) {
			this.phase = "args";
			this._finalizeArgs();
			return;
		}

		// -------------------------------------------------
		// DEFAULT ACTION CHECK
		// -------------------------------------------------

		const hasDefaultAction = "defaultAction" in moduleShape;

		// -------------------------------------------------
		// MODULE FLAGS
		// -------------------------------------------------

		if (!hasDefaultAction && moduleFlagIndex) {

			this.phase = "moduleFlags";

			const moduleFlags = ParsingHelpers.parseFlagsPhase(
				this.tokens,
				this.cursor,
				moduleFlagIndex,
				'long'
			);

			this.cursor = moduleFlags.cursor;
			this.stop = moduleFlags.stopParsing;

			this.result.context.moduleOptions = moduleFlags.values;

			this.result.issues.push(...moduleFlags.issues);

			if (this.stop) {
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ACTION KEYWORD
		// -------------------------------------------------

		if (hasDefaultAction) {

			this.phase = "action";

			const defaultAction = Object.keys(moduleShape.defaultAction!)[0];

			this.result.context.action = defaultAction;

		} else {

			this.phase = "action";

			const actionResult = ParsingHelpers.parseKeywordPhase(
				this.tokens,
				this.cursor,
				"ACTION_MISSING",
				(action) =>
					ModulesHelpers.actionExists(
						actionIndex,
						this.result.context.module!,
						action
					)
			);

			this.cursor = actionResult.cursor;
			this.stop = actionResult.stopParsing;

			this.result.issues.push(...actionResult.issues);

			if (actionResult.value) {

				const resolved = ModulesHelpers.resolveActionName(
					actionIndex,
					this.result.context.module!,
					actionResult.value
				);

				this.result.context.action = resolved;
			}

			if (this.stop) {
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ACTION FLAGS
		// -------------------------------------------------

		if (actionFlagIndex) {

			this.phase = "actionFlags";

			const actionFlags = ParsingHelpers.parseFlagsPhase(
				this.tokens,
				this.cursor,
				actionFlagIndex,
				'long'
			);

			this.cursor = actionFlags.cursor;
			this.stop = actionFlags.stopParsing;

			this.result.context.actionOptions = actionFlags.values;

			this.result.issues.push(...actionFlags.issues);

			if (this.stop) {
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ARGS
		// -------------------------------------------------

		this.phase = "args";
		this._finalizeArgs();
	}

	// -----------------------------------------------------
	// ARGS PHASE
	// -----------------------------------------------------

	/**
	 * Finalize argument collection phase.
	 *
	 * Collects remaining tokens as positional arguments.
	 *
	 * Phase transition:
	 * - args → done
	 */
	private _finalizeArgs() {

		const argsResult = ParsingHelpers.collectArgsPhase(
			this.tokens,
			this.cursor
		);

		this.cursor = argsResult.cursor;

		this.result.context.args = argsResult.args;

		this.phase = "done";
	}

	// -----------------------------------------------------
	// GETTERS
	// -----------------------------------------------------

	/**
	 * Get parsed CLI context.
	 *
	 * @returns RuntimeCliContext
	 */
	public getContext(): RuntimeCliContext {
		return this.result.context;
	}

	/**
	 * Get parsing issues.
	 *
	 * Issues are non-fatal and collected during parsing.
	 *
	 * @returns ParserIssue[]
	 */
	public getIssues(): ParserIssue[] {
		return this.result.issues;
	}

	/**
	 * Get ignored tokens.
	 *
	 * Reserved for future use.
	 *
	 * @returns string[]
	 */
	public getIgnored(): string[] {
		return this.result.ignored;
	}

	/**
	 * Get current parser phase.
	 *
	 * @returns ParserPhase
	 */
	public getPhase(): ParserPhase {
		return this.phase;
	}

	// -----------------------------------------------------
	// FINALIZE
	// -----------------------------------------------------

	/**
	 * Finalize parsing process.
	 *
	 * Validates that parsing is complete and marks result as resolved.
	 *
	 * Emits:
	 * - parserFatal if parsing is incomplete
	 * - parsingDone when successful
	 *
	 * @throws Error if parsing is not in "done" phase
	 */
	public async finalize(): Promise<void> {

		if (this.phase !== "done") {
			await this.ctx.events.internalEmit('parserFatal');
			throw new Error("ParserManager: parsing not finished.");
		}

		this.setResolved(this.result);
		await this.ctx.events.internalEmit('parsingDone');
	}
}
