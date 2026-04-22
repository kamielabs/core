import { ResolverManagerWithDict } from "@abstracts";
import { Context, GlobalsHook } from "@contexts";
import { FinalGlobals } from "@data";
import {
	CoreEventsShape,
	CoreStagesShape,
	CoreGlobalsDecl,
	CoreGlobalsShape,
	CoreModulesShape,
	RuntimeGlobalsFacts,
	CoreTranslationsShape,
	ExtractGlobals
} from "@types";

/**
 * FIX: CRITICAL -> Remove throw errors and create event messages errors (use internalEmit);
 */

/**
 * GlobalsManager
 *
 * Runtime resolver responsible for global CLI options.
 *
 * Responsibilities:
 * - Index global options (ENV + CLI flags)
 * - Validate ENV uniqueness across stages and globals
 * - Parse CLI global flags
 * - Resolve final global values using multi-source precedence
 * - Execute optional developer hook
 * - Produce immutable RuntimeGlobalsFacts
 *
 * Position in lifecycle:
 * - Executes AFTER stages resolution
 * - Executes BEFORE modules/actions resolution
 * - Represents the final step before runtime is considered "ready"
 *
 * Core concept:
 * - Globals act as the bridge between pre-runtime (stages/env)
 *   and runtime execution (modules/actions)
 *
 * Resolution model:
 * - Each global option is backed by an ENV variable (single source of truth)
 * - CLI flags (if defined) override ENV values
 * - Final value is always stored in the runtime globals dictionary
 *
 * Precedence order:
 * DEFAULT < ENV_FILE < ENV_VAR < CLI_FLAG
 *
 * CLI behavior:
 * - Flags may accept a value → that value is used directly
 * - Flags may be value-less → a predefined value is injected
 * - Multiple flags may map to the same global option
 *
 * Design principles:
 * - Deterministic resolution (single pass)
 * - ENV variables are the canonical runtime storage
 * - CLI is only an override layer
 * - No mutation after resolution (freeze enforced)
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class GlobalsManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends ResolverManagerWithDict<
	CoreGlobalsDecl<FinalGlobals<TGlobals>>,
	RuntimeGlobalsFacts,
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Optional developer-defined hook executed after globals resolution.
	 *
	 * Provides:
	 * - resolved options
	 * - runtime context
	 * - tools access
	 * - snapshot access
	 */
	private _customGlobalsHook: GlobalsHook<TEvents, TStages, TGlobals, TModules, TTranslations> | undefined = undefined;

	/**
	 * Constructor.
	 *
	 * Initializes globals dictionary and builds:
	 * - ENV index
	 * - CLI flag index
	 *
	 * @param ctx - Global execution context
	 * @param GlobalsDict - Final globals declaration
	 */
	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		GlobalsDict: FinalGlobals<TGlobals>
	) {

		super(
			ctx,
			{
				options: GlobalsDict,
				flagIndex: { byKey: {} },
				envIndex: { byEnv: {} }

			} satisfies CoreGlobalsDecl<TGlobals>
		);
		this._resolveIndexes();
	}

	/**
	 * Resolve lifecycle.
	 *
	 * Steps:
	 * 1. Validate ENV collisions with stage definitions
	 * 2. Load ENV sources (bootstrap + stage file)
	 * 3. Determine parser next phase (args or module)
	 * 4. Parse CLI global flags
	 * 5. Resolve final global values
	 * 6. Emit globalsHooking event
	 * 7. Execute custom hook (if defined)
	 * 8. Freeze and finalize runtime globals
	 *
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		this._validate();

		const bootstrap = this.ctx.bootstrap.getResolved();
		const fileEnv = this.ctx.helpers.core.loadEnvFile(this.ctx.stages.getResolved().file);

		const envVars = bootstrap.envs;
		const hasDefaultModule =
			Object.prototype.hasOwnProperty.call(this.ctx.modules.getDict().modules, "__defaultModule__");

		const nextPhase = hasDefaultModule ? "args" : "module";

		// Parse CLI globals
		this.ctx.parser.resolveGlobals(this.getDict().flagIndex, nextPhase);

		const resolved = this._resolveGlobalsValues(envVars, fileEnv);
		this.setDraft(resolved);

		this.ctx.events.internalEmit("globalsHooking");

		if (this._customGlobalsHook) {
			this._customGlobalsHook({
				options: this.getDraft() as ExtractGlobals<TGlobals>,
				runtime: this.ctx.runtime.globalsContext(),
				tools: this.ctx.tools.globalsContext(),
				snapshot: this.ctx.snapshot.snapshotContext()
			})
		}

		this.freezeDict();
		this.setResolved(resolved);
	}

	/**
	 * Build indexes for global options.
	 *
	 * Creates:
	 * - envIndex.byEnv → ENV variable → (group, option)
	 * - flagIndex.byKey → CLI flag → (group, option, metadata)
	 *
	 * Validation rules:
	 * - ENV variables must be unique across all globals
	 * - CLI flags (long, short, aliases) must be unique
	 *
	 * Supports:
	 * - long flags (--flag)
	 * - short flags (-f)
	 * - aliases (short or long)
	 *
	 * @throws Error if duplicates are detected
	 */
	private _resolveIndexes() {

		const decl = this.getDict();

		for (const groupName in decl.options) {

			const group = decl.options[groupName];

			for (const optionName in group) {

				const opt = group[optionName];
				if (!opt) continue;

				// ENV index
				if (decl.envIndex.byEnv[opt.env]) {
					throw new Error(
						`Duplicate ENV variable "${opt.env}" detected in globals`
					);
				}
				decl.envIndex.byEnv[opt.env] = {
					env: opt.env,
					groupName,
					optionName
				};

				if (!opt.cli) continue;

				for (const flag of opt.cli) {
					const longRawkey = `--${flag.long}`;
					if (decl.flagIndex.byKey[longRawkey]) {
						throw new Error(
							`Duplicate CLI flag "${longRawkey}" detected in globals`
						);
					}
					decl.flagIndex.byKey[longRawkey] = {
						key: flag.long,
						raw: longRawkey,
						kind: 'long',
						groupName,
						optionName,
						cliOption: flag
					};

					if (flag.short) {
						const shortRawkey = `-${flag.short}`;
						if (decl.flagIndex.byKey[shortRawkey]) {
							throw new Error(
								`Duplicate CLI flag "-${flag.short}" detected in globals`
							);
						}
						decl.flagIndex.byKey[shortRawkey] = {
							key: flag.short,
							raw: shortRawkey,
							kind: 'short',
							groupName,
							optionName,
							cliOption: flag
						};
					}

					if (flag.aliases) {
						for (const alias of flag.aliases) {
							if (alias.length === 1) {
								const shortAliasRawKey = `-${alias}`;
								if (decl.flagIndex.byKey[alias]) {
									throw new Error(
										`Duplicate CLI flag "${shortAliasRawKey}" detected in globals`
									);
								}
								decl.flagIndex.byKey[shortAliasRawKey] = {
									key: alias,
									raw: shortAliasRawKey,
									kind: 'short',
									groupName,
									optionName,
									cliOption: flag
								};
							} else {
								const longAliasRawKey = `--${alias}`
								if (decl.flagIndex.byKey[alias]) {
									throw new Error(
										`Duplicate CLI flag "${longAliasRawKey}" detected in globals`
									);
								}
								decl.flagIndex.byKey[longAliasRawKey] = {
									key: alias,
									raw: longAliasRawKey,
									kind: 'long',
									groupName,
									optionName,
									cliOption: flag
								};
							}
						}
					}

				}
			}
		}
	}

	/**
	 * Resolve all global values.
	 *
	 * Resolution order per option:
	 * 1. Default value
	 * 2. ENV file override
	 * 3. ENV variable override
	 * 4. CLI override (highest priority)
	 *
	 * Important:
	 * - CLI values are already parsed and normalized by ParserManager
	 * - Final values are stored grouped by global group
	 *
	 * @param envVars - Environment variables from bootstrap
	 * @param fileEnv - Parsed ENV file values
	 * @returns RuntimeGlobalsFacts
	 */
	private _resolveGlobalsValues(
		envVars: Record<string, string | undefined>,
		fileEnv: Record<string, string>
	): RuntimeGlobalsFacts {

		const decl = this.getDict();
		const resolved: RuntimeGlobalsFacts = {};

		const cliGlobals = this.ctx.parser.getContext().globals ?? {};

		for (const groupName in decl.options) {

			const group = decl.options[groupName];

			for (const optionName in group) {

				const opt = group[optionName];
				if (!opt) continue;

				const envKey = opt.env;
				const defaultValue = opt.default;

				resolved[groupName] ??= {};
				resolved[groupName][optionName] = defaultValue;

				// ENV FILE override
				if (envKey && fileEnv[envKey] !== undefined) {
					resolved[groupName][optionName] = this.ctx.helpers.core.castEnvValue(fileEnv[envKey], defaultValue);
				}

				// ENV VAR override
				if (envKey && envVars[envKey] !== undefined) {
					resolved[groupName][optionName] = this.ctx.helpers.core.castEnvValue(envVars[envKey] as string, defaultValue);
				}

				// CLI override
				const cliValue = cliGlobals[groupName]?.[optionName];
				if (cliValue !== undefined) {
					resolved[groupName][optionName] = cliValue;
				}

			}

		}

		return resolved;
	}

	/**
	 * Validate globals ENV declarations against stage ENV declarations.
	 *
	 * Rule:
	 * - A global ENV key must NOT collide with a stage ENV key
	 *
	 * This prevents:
	 * - ambiguous resolution sources
	 * - undefined override behavior
	 *
	 * @throws Error if collision is detected
	 */
	private _validate() {
		const runtimeStage = this.ctx.stages.getResolved().name;
		const globalsEnvIndex = this.getDict().envIndex.byEnv;
		const stageEnvIndex = this.ctx.stages.getDict().envIndex.byStage[runtimeStage];
		const stageEnv = stageEnvIndex?.byEnv ?? {};

		for (const env in globalsEnvIndex) {

			if (stageEnv[env]) {
				throw new Error(
					`ENV "${env}" already declared in stage "${runtimeStage}" props`
				);
			}

		}
	}

	/**
	 * Register a custom globals hook.
	 *
	 * Notes:
	 * - Builtin globals cannot be extended or mutated structurally
	 * - Hook operates only on resolved values
	 * - Designed for runtime adjustments, not declaration changes
	 *
	 * @param hook - GlobalsHook implementation
	 */
	public customHook(hook: GlobalsHook<TEvents, TStages, TGlobals, TModules, TTranslations, ExtractGlobals<TGlobals>>) {
		this._customGlobalsHook = hook;
	}
}
