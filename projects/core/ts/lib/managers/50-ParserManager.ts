import { Context } from "@contexts";

import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	ParserPhase,
	FlagIndex,
	RuntimeCliContext,
	ParsedCliContextResult,
	ModuleIndex,
	ActionIndex,
	CoreTranslationsShape,
	RuntimeAppShape,
	CoreEventsChannelsShape
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
 * - Produce ParsedCliContextResult snapshots after each resolved phase
 *
 * Core design:
 * - Single-pass, left-to-right parsing
 * - Phase-driven parsing (strict lifecycle)
 * - Deterministic and predictable behavior
 * - No backtracking
 * - Long-lived lifecycle spanning from post-stages initialization to final runtime resolution
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
 * - `resolved` is intentionally refreshed phase by phase
 * - No mutation after finalize()
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class ParserManager<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private _ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	/**
	 * Accumulated parsing result.
	 *
	 * - context → parsed CLI structure
	 * - ignored → unused tokens
	 * - issues → non-fatal parsing problems
	 */
	private _draft: ParsedCliContextResult | undefined = {
		context: {},
		ignored: [],
	};

	private _resolved?: ParsedCliContextResult;

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
	 * Constructor.
	 *
	 * @param ctx - Global execution context
	 */
	private constructor(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	) {
		this._ctx = ctx;
	}

	public static create<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: Context<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
	): ParserManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new ParserManager(ctx);
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	public getDraft(): ParsedCliContextResult {
		if (!this._draft) {
			this._ctx.events.throw('parserMissingDraft');
		}
		return this._draft;
	}

	private _clearDraft() {
		this._draft = undefined;
	}

	/**
	 * Refresh the latest resolved parser snapshot.
	 *
	 * Unlike other managers, parser resolution is incremental: each completed
	 * phase updates `_resolved` so downstream runtime steps can safely consume
	 * the latest strict procedural state.
	 */
	private _setResolved(state: ParsedCliContextResult) {
		this._resolved = state;
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	/**
	 * Return the latest resolved parser snapshot.
	 *
	 * This may represent a partial but valid state while the parser lifecycle
	 * is still in progress.
	 */
	public getResolved(): ParsedCliContextResult {
		if (!this._resolved) {
			this._ctx.events.throw('parserMissingResolved');
		}
		return this._resolved;
	}

	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
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
	 * It reinitializes the parser lifecycle from raw bootstrap arguments and is
	 * intentionally reusable across runs, but never mid-lifecycle.
	 */
	public async resolve(): Promise<void> {

		const bootstrap = this._ctx.bootstrap.getResolved();
		const args = bootstrap.script.args;

		this.tokens = [...args];
		this.cursor = 0;
		this.stop = false;


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
	 * - Persists an intermediate resolved snapshot once the phase is complete
	 *
	 * Phase transition:
	 * - "globalFlags" → nextPhase OR "args"
	 *
	 * @param flagIndex - Global flags index
	 * @param nextPhase - Next phase ("module" or "args")
	 *
	 */
	public async resolveGlobals(flagIndex: FlagIndex, nextPhase: 'module' | 'args' = 'module') {

		const neededPhase = 'globalFlags';

		if (this.phase !== neededPhase) {
			this._ctx.events.throw('parserInvalidPhase', {
				values: { neededPhase, currentPhase: this.phase, method: 'resolveGlobals' }
			});
		}

		const parsed = await this._ctx.helpers.parser.parseFlagsPhase(
			this._ctx,
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

		this.getDraft().context.globals = grouped;


		// Hardcoded help and version detection
		const hasHelp = parsed.values["help"] === true;
		const hasVersion = parsed.values["version"] === true;

		if (hasHelp || hasVersion) {
			this.phase = "module";
		} else {
			this.phase = nextPhase;
		}

		this._setResolved(this._ctx.helpers.core.deepClone(this.getDraft()));
	}

	/**
	 * Finalize parsing directly to args phase.
	 *
	 * Used when parsing must skip module/action resolution.
	 *
	 */
	public finalizeArgsPhase() {
		const neededPhase = 'args';

		if (this.phase !== neededPhase) {
			this._ctx.events.throw('parserInvalidPhase', {
				values: { neededPhase, currentPhase: this.phase, method: 'finalizeArgsPhase' }
			});
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
	 * - The heavy parsing mechanics stay delegated to helpers so this manager
	 *   remains an orchestration layer
	 *
	 * Phase transitions:
	 * - module → moduleFlags → action → actionFlags → args → done
	 *
	 * @param moduleIndex - Module lookup index
	 * @param actionIndex - Action lookup index
	 * @param moduleFlagIndex - Optional module flags index
	 * @param actionFlagIndex - Optional action flags index
	 *
	 */
	public async resolveModule(
		moduleIndex: ModuleIndex,
		actionIndex: ActionIndex,
		moduleFlagIndex?: FlagIndex,
		actionFlagIndex?: FlagIndex,
		forceModule?: string,
	) {

		const neededPhase = 'module';

		if (this.phase !== neededPhase) {
			this._ctx.events.throw('parserInvalidPhase', {
				values: { neededPhase, currentPhase: this.phase, method: 'resolveModule' }
			});
		}

		const draft = this.getDraft();

		// -------------------------------------------------
		// MODULE KEYWORD
		// -------------------------------------------------

		let moduleShape;

		if (forceModule) {

			draft.context.module = forceModule;
			moduleShape = moduleIndex.byName[forceModule];

		} else {

			const moduleResult = await this._ctx.helpers.parser.parseKeywordPhase(
				this._ctx,
				this.tokens,
				this.cursor,
				"MODULE_MISSING",
				(name) => this._ctx.helpers.modules.moduleExists(moduleIndex, name)
			);

			this.cursor = moduleResult.cursor;
			this.stop = moduleResult.stopParsing;

			if (moduleResult.value) {

				const resolved = this._ctx.helpers.modules.resolveModuleName(
					moduleIndex,
					moduleResult.value
				);

				draft.context.module = resolved;
				moduleShape = moduleIndex.byName[resolved];
			}
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

			const moduleFlags = await this._ctx.helpers.parser.parseFlagsPhase(
				this._ctx,
				this.tokens,
				this.cursor,
				moduleFlagIndex,
				'long'
			);

			this.cursor = moduleFlags.cursor;
			this.stop = moduleFlags.stopParsing;

			draft.context.moduleOptions = moduleFlags.values;

			if (this.stop) {
				this.phase = "args";
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ACTION KEYWORD
		// -------------------------------------------------

		this.phase = "action";

		if (hasDefaultAction) {

			const defaultAction = Object.keys(
				moduleShape.defaultAction!
			)[0];

			draft.context.action = defaultAction;

		} else {

			const actionResult = await this._ctx.helpers.parser.parseKeywordPhase(
				this._ctx,
				this.tokens,
				this.cursor,
				"ACTION_MISSING",
				(action) =>
					this._ctx.helpers.modules.actionExists(
						actionIndex,
						draft.context.module!,
						action
					)
			);

			this.cursor = actionResult.cursor;
			this.stop = actionResult.stopParsing;

			if (actionResult.value) {

				const resolved = this._ctx.helpers.modules.resolveActionName(
					actionIndex,
					draft.context.module!,
					actionResult.value
				);

				draft.context.action = resolved;
			}

			if (this.stop) {
				this.phase = "args";
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ACTION FLAGS
		// -------------------------------------------------

		if (actionFlagIndex) {

			this.phase = "actionFlags";

			const actionFlags = await this._ctx.helpers.parser.parseFlagsPhase(
				this._ctx,
				this.tokens,
				this.cursor,
				actionFlagIndex,
				'long'
			);

			this.cursor = actionFlags.cursor;
			this.stop = actionFlags.stopParsing;

			draft.context.actionOptions = actionFlags.values;

			if (this.stop) {
				this.phase = "args";
				this._finalizeArgs();
				return;
			}
		}

		// -------------------------------------------------
		// ARGS
		// -------------------------------------------------

		this.phase = "args";

		this._setResolved(
			this._ctx.helpers.core.deepClone(draft)
		);

		this._finalizeArgs();
	}

	// -----------------------------------------------------
	// ARGS PHASE
	// -----------------------------------------------------

	/**
	 * Finalize argument collection phase.
	 *
	 * Collects remaining tokens as positional arguments.
	 * This is the last procedural parsing step before `finalize()`.
	 *
	 * Phase transition:
	 * - args → done
	 */
	private _finalizeArgs() {

		const argsResult = this._ctx.helpers.parser.collectArgsPhase(
			this.tokens,
			this.cursor
		);

		this.cursor = argsResult.cursor;

		this.getDraft().context.args = argsResult.args;

		this.phase = "done";

		this._setResolved(this._ctx.helpers.core.deepClone(this.getDraft()));
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
		return this.getResolved().context;
	}

	/**
	 * Get ignored tokens.
	 *
	 * Reserved for future use.
	 *
	 * @returns string[]
	 */
	public getIgnored(): string[] {
		return this.getResolved().ignored;
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
	 * Validates that parsing is complete and closes the parser lifecycle.
	 *
	 * At this point:
	 * - the latest resolved snapshot becomes final
	 * - the mutable draft is discarded
	 * - downstream managers must only consume resolved parser state
	 *
	 * Emits:
	 * - `parserInvalidPhase` if parsing is incomplete
	 */
	public finalize(): void {

		const neededPhase = 'done';
		if (this.phase !== neededPhase) {
			this._ctx.events.throw('parserInvalidPhase', {
				values: {
					neededPhase, currentPhase: this.phase, method: 'finalize'
				}
			});
		}

		this._setResolved(this._ctx.helpers.core.deepClone(this.getDraft()));
		this._clearDraft();
	}
}
