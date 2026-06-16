import fs from "fs";
import {
	Context,
	StageHook
} from "@contexts";
import { FinalStages } from "@data";
import {
	BuiltinStageKey,
	BuiltinStageOptions,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreStagesShapeDecl,
	CoreTranslationsShape,
	CustomStageKey,
	CustomStageOptions,
	DefaultStageOptions,
	ParsedOptionValue,
	RuntimeStageFacts,
	StageOption,
	StageShape
} from "@types";

/**
 * WARNING: Prevent stage name collision with reserved names ("default" + defaultStageName) → enforced at init/build time
 *
 * FIX: Add validation helper for paths (exists, permissions, normalization) → Replace direct `fs.existsSync`
 *
 * FIX: Replace direct `fs` usage with CoreHelpers (cross-platform FS abstraction) → Required for Windows / multi-shell compatibility
 *
 * FIX: Normalize path handling (support "~", relative paths, env expansion) → Should be centralized in CoreHelpers
 *
 * TODO: Replace Object.hasOwn(...) for builtin detection (type-safe or data-driven) → Avoid coupling logic to hook registration state
 *
 * TODO: Ensure _coreStageHook is platform-safe (depends on FS helpers)
 *
 * TODO: Consider splitting resolve() if complexity grows
 *
 * TODO: Add debug trace for option resolution (DX improvement)
 *
 * NOTE: Make default stage name configurable (not hardcoded "default")
 */

/**
 * StagesManager
 *
 * Central resolver responsible for computing runtime stage facts.
 *
 * Responsibilities:
 * - Resolve active stage name from environment
 * - Resolve stage options (defaults + ENV file + ENV vars)
 * - Apply builtin overrides (default stage)
 * - Execute invariant validation hook
 * - Execute optional user-defined hook
 * - Produce immutable RuntimeStageFacts
 *
 * Runtime role:
 * - Stages define pre-runtime configuration
 * - They provide baseline runtime settings such as `lang` and `workingDir`
 * - They may also expose pre-runtime ENV-driven switches so the frozen runtime
 *   can adapt before globals, i18n, parser, and modules resolution
 *
 * Design principles:
 * - Runtime is the single source of truth
 * - Draft → resolve → freeze lifecycle
 * - No mutation after resolution
 * - Hooks operate on resolved values only
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class StagesManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	private _dict: CoreStagesShapeDecl<TStages>;
	private _draft?: RuntimeStageFacts | undefined;
	private _resolved?: RuntimeStageFacts;
	/**
	 * Stored overrides for builtin default stage.
	 *
	 * Applied during resolve():
	 * - AFTER draft creation
	 * - BEFORE invariant validation
	 * - BEFORE hooks execution
	 */
	private _builtinStageDefaults?: {
		file?: string;
		options?: DefaultStageOptions;
	};

	/**
	 * Builtin stage hooks registry.
	 *
	 * Keys are inferred from BuiltinStageKey<TStages>.
	 * Each hook is strongly typed against its stage options.
	 */
	private _builtinStageHooks: {
		[S in BuiltinStageKey<TStages>]?: StageHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			BuiltinStageOptions<TStages, S>
		>
	} = {};

	/**
	 * Custom stage hooks registry.
	 *
	 * Keys are inferred from user-defined stages.
	 */
	private _customStageHooks: {
		[S in CustomStageKey<TStages>]?: StageHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			CustomStageOptions<TStages, S>
		>
	} = {};

	/**
	 * Constructor.
	 *
	 * Initializes stage dictionary and builds lookup indexes.
	 *
	 * @param ctx - Global execution context
	 * @param stageDict - Fully resolved stage definitions
	 */
	constructor(
		ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		stages: FinalStages<TStages>
	) {
		this._ctx = ctx;
		this._dict = {
			stages,
			envIndex: { byStage: {} },
			stageIndex: { byName: {} }
		};

		// Build all lookup indexes once at construction
		// this._resolveIndexes();
		// this._freezeDict();
	}

	public init: () => Promise<void> = async (): Promise<void> => {
		this._resolveIndexes();
		this._freezeDict();
	}

	/**
	 * Freeze the declaration dictionary once stage lookup indexes are prepared.
	 */
	private _freezeDict() {
		this._dict = this._ctx.helpers.core.deepFreeze(this._dict);
	}

	/**
	 * Store the mutable runtime stage draft before final freezing.
	 */
	private _setDraft(state: RuntimeStageFacts) {
		this._draft = state;
	}

	/**
	 * Clear the mutable runtime stage draft once resolution is finalized.
	 */
	private _clearDraft() {
		this._draft = undefined;
	}

	/**
	 * Freeze and persist the final immutable runtime stage facts.
	 */
	private _setResolved(state: RuntimeStageFacts): void | never {
		if (this._resolved) {
			this._ctx.events.throw('stagesAlreadyResolved');
		}
		this._resolved = this._ctx.helpers.core.deepClone(state);
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	public getDict(): CoreStagesShapeDecl<TStages> {
		return this._dict;
	}

	/**
	 * Return the current mutable runtime stage draft.
	 */
	public getDraft(): RuntimeStageFacts {
		if (!this._draft) {
			this._ctx.events.throw('stagesMissingDraft');
		}
		return this._draft;
	}

	/**
	 * Return the final immutable runtime stage facts.
	 */
	public getResolved(): RuntimeStageFacts {
		if (!this._resolved) {
			this._ctx.events.throw('stagesMissingResolved');
		}
		return this._resolved!;
	}

	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
	}

	/**
	 * Build internal indexes for fast lookup.
	 *
	 * Creates:
	 * - stageIndex.byName → direct stage lookup
	 * - envIndex.byStage → ENV → (stage, option)
	 *
	 * Also validates:
	 * - uniqueness of ENV keys per stage
	 *
	 */
	private _resolveIndexes() {
		const stages = this._dict.stages;

		for (const stageName in stages) {
			const stage = stages[stageName];
			if (!stage) continue;

			this._dict.stageIndex.byName[stageName] = stage;
			for (const [optionName, opt] of Object.entries(stage.options)) {
				if (!opt) continue;

				const envKey = opt.env;
				if (!envKey) continue;

				if (this._dict.envIndex.byStage[stageName]?.byEnv[envKey]) {
					const existing = this._dict.envIndex.byStage[stageName].byEnv[envKey];
					this._ctx.events.throw('stageDuplicateEnv', {
						details: [`Env Key: ${envKey}`, `Stage: ${existing.stageName}`, `Option: ${existing.optionName}`]
					});
				}

				this._dict.envIndex.byStage[stageName] ??= { byEnv: {} };
				this._dict.envIndex.byStage[stageName].byEnv[envKey] = {
					env: envKey,
					stageName,
					optionName
				};
			}
		}
	}

	private _resolveStageFile(
		stageName: string,
		stage: StageShape,
	): string {
		if (
			stageName === "default" &&
			this._builtinStageDefaults?.file
		) {
			return this._builtinStageDefaults.file;
		}

		return stage.file ?? "";
	}

	/**
	 * Resolve a single option value.
	 *
	 * Resolution priority:
	 * DEFAULT < ENV_FILE < ENV_VAR
	 *
	 * Stage options are pre-runtime only: their resolved values become the
	 * baseline consumed later by the runtime services and managers.
	 *
	 * @param opt - Stage option definition
	 * @param envVars - process.env
	 * @param fileEnv - parsed .env file
	 * @returns Parsed option value
	 */
	private _resolveOptionValue(
		opt: StageOption,
		envVars: Record<string, string | undefined>,
		fileEnv: Record<string, string>
	): ParsedOptionValue {
		const envKey = opt.env;
		const defaultValue = opt.default;

		let value = defaultValue;

		if (envKey && fileEnv[envKey] !== undefined) {
			value = this._ctx.helpers.core.castEnvValue(fileEnv[envKey], defaultValue);
		}

		if (envKey && envVars[envKey] !== undefined) {
			value = this._ctx.helpers.core.castEnvValue(envVars[envKey] as string, defaultValue);
		}

		return value;
	}

	/**
	 * Apply developer overrides on builtin default stage.
	 *
	 * Applies only on draft (pre-resolution finalization).
	 */
	// private _applyBuiltinStageDefaults() {
	// 	const values = this._builtinStageDefaults;
	// 	if (!values) return;
	//
	//
	// 	if (values.file !== undefined) {
	// 		this.getDraft().file = values.file;
	// 	}
	//
	// 	if (values.options) {
	// 		for (const key of Object.keys(values.options) as Array<keyof typeof values.options>) {
	// 			const value = values.options[key];
	// 			if (value !== undefined) {
	// 				(this.getDraft().options as Record<string, ParsedOptionValue>)[key] = value;
	// 			}
	// 		}
	// 	}
	// }
	private _applyBuiltinStageDefaults(
		stageName: string,
		stage: StageShape,
	): StageShape {
		const values = this._builtinStageDefaults;

		if (!values || stageName !== "default") {
			return stage;
		}
		const file = values.file ?? stage.file;

		return {
			...(file !== undefined ? { file } : {}),
			options: {
				...stage.options,
			},
		};
	}
	/**
	 * Override builtin default stage values.
	 *
	 * @param values - Partial override (file and/or options)
	 */
	public overrideDefaultStage(values: {
		file?: string;
		options?: DefaultStageOptions
	}) {
		this._builtinStageDefaults = values;
	}

	/**
	 * Register a hook for a builtin stage.
	 *
	 * @param stage - Builtin stage key
	 * @param hook - Hook function
	 */
	public registerBuiltinStageHook<
		S extends BuiltinStageKey<TStages>
	>(
		stage: S,
		hook: StageHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			BuiltinStageOptions<TStages, S>
		>
	) {
		this._builtinStageHooks[stage] = hook;
	}

	/**
	 * Register a hook for a custom stage.
	 *
	 * @param stage - Custom stage key
	 * @param hook - Hook function
	 */
	public registerCustomStageHook<
		S extends CustomStageKey<TStages>
	>(
		stage: S,
		hook: StageHook<
			TEvents, TStages, TGlobals, TModules, TTranslations,
			CustomStageOptions<TStages, S>
		>
	) {
		this._customStageHooks[stage] = hook;
	}

	/**
	 * Retrieve the hook associated with a stage.
	 *
	 * Resolution order:
	 * - builtin hooks
	 * - custom hooks
	 *
	 * @param stage - Stage name
	 * @returns Hook or undefined
	 */
	public getStageHook(
		stage: string
	): StageHook<
		TEvents, TStages, TGlobals, TModules, TTranslations
	> | undefined {
		const builtin = this._builtinStageHooks as Record<string, any>;
		const custom = this._customStageHooks as Record<string, any>;

		return builtin[stage] ?? custom[stage];
	}

	/**
	 * Core invariant hook (always executed).
	 *
	 * Validates:
	 * - `lang`: required non-empty string for runtime i18n selection
	 * - `workingDir`: if provided, must exist before runtime starts
	 *
	 * Emits internal events on failure.
	 *
	 * @param options - Resolved stage options
	 */
	private async _coreStageHook(
		options: Record<string, ParsedOptionValue>
	) {

		const lang = options.lang;
		const workingDir = options.workingDir;

		if (!lang || typeof lang !== 'string' || lang.trim() === '') {
			this._ctx.events.throw('stageMissingLang', { details: [`Lang: ${lang}`] });
		}

		if (workingDir) {
			if (typeof workingDir !== 'string' || !fs.existsSync(workingDir)) {
				this._ctx.events.throw('stageMissingWorkingDir', { details: [`Path: ${workingDir}`] });
			}
		}
	}

	/**
	 * Resolve lifecycle.
	 *
	 * Steps:
	 * 1. Compute stage name
	 * 2. Resolve options
	 * 3. Build draft
	 * 4. Apply builtin overrides
	 * 5. Emit stageHooking event
	 * 6. Execute core invariant hook
	 * 7. Execute user hook (if any)
	 * 8. Freeze and finalize runtime facts
	 *
	 * This is the last pre-runtime configuration step before globals and the
	 * rest of the runtime pipeline build on top of the selected stage facts.
	 *
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		const rawStage = process.env._NODE_CLI_STAGE;
		const defaultStageName = this._ctx.settings.defaultStageName ?? 'default';

		const stageName =
			!rawStage || rawStage === defaultStageName
				? 'default'
				: rawStage;

		const stage = this._dict.stageIndex.byName[stageName];

		if (!stage) {
			this._ctx.events.throw('stageMissing', { details: [`Name: ${stageName}`] })
		}

		if (typeof stage.file !== 'string') {
			this._ctx.events.throw('stageMissingFile', { details: [`StageFile: ${stage.file}`] });
		}

		if (stageName === "default") this._applyBuiltinStageDefaults(stageName, stage);

		const envVars = process.env as Record<string, string | undefined>;
		const stageFile = this._resolveStageFile(stageName, stage);

		const fileEnv = this._ctx.helpers.core.loadEnvFile(stageFile);

		const resolvedOptions: Record<string, ParsedOptionValue> = {};

		for (const optionName in stage.options) {
			const opt = stage.options[optionName];
			if (!opt) continue;

			resolvedOptions[optionName] = this._resolveOptionValue(opt, envVars, fileEnv);
		}

		const facts: RuntimeStageFacts = {
			name: stageName,
			file: stage.file,
			options: resolvedOptions
		};

		this._setDraft(facts);

		// Apply defaults only for builtin stage
		// if (Object.hasOwn(this._builtinStageHooks, stageName)) {
		// 	this._applyBuiltinStageDefaults();
		// }

		await this._ctx.events.emit('stageHooking');

		await this._coreStageHook(this.getDraft().options);

		const hook = this.getStageHook(stageName);

		if (hook) {
			await hook({
				options: this.getDraft().options,
				tools: this._ctx.tools.stageContext(),
				runtime: this._ctx.runtime.stageContext(),
				snapshot: this._ctx.snapshot.snapshotContext()
			});
		}


		this._setResolved(this.getDraft());
		this._clearDraft();
	}
}
