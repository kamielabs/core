import fs from "fs";
import { ResolverManagerWithDict } from "@abstracts";
import {
	Context,
	StageHook
} from "@contexts";
import { FinalStages } from "@data";
import {
	CoreError
} from "@helpers";
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
	StageOption
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
> extends ResolverManagerWithDict<
	CoreStagesShapeDecl<TStages>,
	RuntimeStageFacts,
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

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
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		stageDict: FinalStages<TStages>
	) {
		super(
			ctx,
			{
				stages: stageDict,
				envIndex: { byStage: {} },
				stageIndex: { byName: {} }
			}
		);

		// Build all lookup indexes once at construction
		this._resolveIndexes();
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
	 * @throws CoreError if duplicate ENV key is detected
	 */
	private _resolveIndexes() {
		const stages = this._dict.stages;

		for (const stageName in stages) {
			const stage = stages[stageName];
			if (!stage) continue;

			this._dict.stageIndex.byName[stageName] = stage;

			for (const optionName in stage.options) {
				const opt = stage.options[optionName];
				if (!opt) continue;

				const envKey = opt.env;
				if (!envKey) continue;

				if (this._dict.envIndex.byStage[stageName]?.byEnv[envKey]) {
					const existing = this._dict.envIndex.byStage[stageName].byEnv[envKey];

					throw new CoreError(
						"STAGE_ENV_DUPLICATE",
						"Stages",
						`Duplicate ENV key "${envKey}" detected in stage "${existing.stageName}" (option "${existing.optionName}")`
					);
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

	/**
	 * Resolve a single option value.
	 *
	 * Resolution priority:
	 * DEFAULT < ENV_FILE < ENV_VAR
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
			value = this.ctx.helpers.core.castEnvValue(fileEnv[envKey], defaultValue);
		}

		if (envKey && envVars[envKey] !== undefined) {
			value = this.ctx.helpers.core.castEnvValue(envVars[envKey] as string, defaultValue);
		}

		return value;
	}

	/**
	 * Apply developer overrides on builtin default stage.
	 *
	 * Applies only on draft (pre-resolution finalization).
	 */
	private _applyBuiltinStageDefaults() {
		const values = this._builtinStageDefaults;
		if (!values) return;

		const draft = this.getDraft();

		if (values.file !== undefined) {
			draft.file = values.file;
		}

		if (values.options) {
			for (const key of Object.keys(values.options) as Array<keyof typeof values.options>) {
				const value = values.options[key];
				if (value !== undefined) {
					(draft.options as Record<string, ParsedOptionValue>)[key] = value;
				}
			}
		}
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
	 * - lang: required non-empty string
	 * - workingDir: if provided, must exist
	 *
	 * Emits internal events on failure.
	 *
	 * @param options - Resolved stage options
	 */
	private async _coreStageHook(
		options: Record<string, ParsedOptionValue>
	) {
		const events = this.ctx.events;

		const lang = options.lang;
		const workingDir = options.workingDir;

		if (!lang || typeof lang !== 'string' || lang.trim() === '') {
			await events.internalEmit('stageLangError');
			return;
		}

		if (workingDir) {
			if (typeof workingDir !== 'string' || !fs.existsSync(workingDir)) {
				await events.internalEmit('stageWorkingDirError');
				return;
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
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		const rawStage = process.env._NODE_CLI_STAGE;
		const defaultStageName = this.ctx.settings.defaultStageName ?? 'default';

		const stageName =
			!rawStage || rawStage === defaultStageName
				? 'default'
				: rawStage;

		const stage = this._dict.stageIndex.byName[stageName];
		if (!stage) {
			this.ctx.events.internalEmit('stageNotFound')
			return;
		}

		if (!stage.file) {
			this.ctx.events.internalEmit('stageFileNotFound');
			return;
		}

		const envVars = process.env as Record<string, string | undefined>;
		const fileEnv = this.ctx.helpers.core.loadEnvFile(stage.file);

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

		this.setDraft(facts);

		// Apply defaults only for builtin stage
		if (Object.hasOwn(this._builtinStageHooks, stageName)) {
			this._applyBuiltinStageDefaults();
		}

		this.ctx.events.internalEmit('stageHooking');

		await this._coreStageHook(this.getDraft().options);

		const hook = this.getStageHook(stageName);

		if (hook) {
			await hook({
				options: this.getDraft().options,
				tools: this.ctx.tools.stageContext(),
				runtime: this.ctx.runtime.stageContext(),
				snapshot: this.ctx.snapshot.snapshotContext()
			});
		}

		this.freezeDict();

		this.setResolved(this.getDraft());
		this.clearDraft();
	}
}
