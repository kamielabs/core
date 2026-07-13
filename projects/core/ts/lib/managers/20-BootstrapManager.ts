import { dirname } from "node:path"; // Put this in providers ??
import { BootstrapManagerContext } from "@contexts";
import {
	CoreEventsShape,
	RuntimeCoreFacts,
	CoreTranslationsShape,
	CoreEventsChannelsShape,
	CoreStagesShape,
	CoreGlobalsShape,
	CoreModulesShape,
	RuntimeAppShape
} from "@types";

/**
 * BootstrapManager
 *
 * First resolution step of the core runtime.
 *
 * Responsibilities:
 * - Extract raw execution context from the active Node.js process
 * - Copy and normalize CLI invocation data (argv, script, cwd)
 * - Copy and expose environment variables in a uniform runtime shape
 *
 * Important:
 * - This is the VERY FIRST runtime resolver
 * - No dependency on other managers
 * - No parsing logic here (pure data extraction)
 * - All downstream managers rely on this normalized bootstrap snapshot
 *
 * Lifecycle:
 * - Called during runtime.setBootstrap()
 * - Emits bootstrapInit event
 * - Produces RuntimeCoreFacts
 *
 * Design philosophy:
 * - Deterministic
 * - Zero external dependency
 * - Linux / shell-oriented for v0.1
 *
 * Notes:
 * - Current implementation targets the initial Node.js + shell runtime only
 * - It is expected to evolve later into a platform/shell abstraction layer
 */
export class BootstrapManager<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private _ctx: BootstrapManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	private _resolved?: RuntimeCoreFacts

	private constructor(ctx: BootstrapManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>) {
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
		ctx: BootstrapManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>
	): BootstrapManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new BootstrapManager(ctx);
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	/**
	 * Freeze and persist the normalized bootstrap runtime facts.
	 */
	private _setResolved(state: RuntimeCoreFacts): void | never {
		if (this._resolved) {
			this._ctx.events.throw('bootstrapAlreadyResolved');
		}
		this._resolved = this._ctx.helpers.core.deepClone(state);
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	public getResolved(): RuntimeCoreFacts {
		if (!this._resolved) {
			this._ctx.events.throw('bootstrapMissingResolved');
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
	 * Resolve bootstrap facts.
	 *
	 * Steps:
	 * 1. Read process-backed runtime inputs
	 * 2. Normalize them into RuntimeCoreFacts
	 * 3. Freeze the snapshot for downstream managers
	 *
	 * Notes:
	 * - No validation here
	 * - No parsing here
	 * - Only minimal normalization of the active process/shell context
	 */
	public async resolve(): Promise<void> {
		// We can setup a test here and throw a fatal event if needed, rn its not, we keep it as it.
		this._setResolved(this._load());
	}

	/**
	 * Load the active process execution environment.
	 *
	 * Extracts:
	 * - Node binary path
	 * - Script path & metadata
	 * - CLI arguments
	 * - Current working directory
	 * - Environment variables
	 *
	 * Constraints:
	 * - No external dependencies
	 * - No side effects
	 * - Fully synchronous
	 * - Current implementation assumes the initial Linux/shell runtime model
	 *
	 * Output:
	 * - RuntimeCoreFacts (immutable runtime snapshot)
	 *
	 * This method defines the root runtime snapshot later reused by all other managers.
	 */
	private _load(): RuntimeCoreFacts {

		// 1. Retrieve command line and parse it
		const fullCommandLine: Readonly<string[]> = [...process.argv];
		const args = [...process.argv];
		const node = args.shift()!;
		const script = args.shift()!;
		const scriptPath = dirname(script);

		// 2. Parse Script File Name
		const scriptFile = script.split('/').reverse()[0]!;
		const scriptExt = scriptFile?.endsWith('.ts') ? "ts" : "js";
		const scriptName = scriptFile?.replace(`.${scriptExt}`, '');

		// 3. Retrieve Current Path (from where CLI is executed)
		const currentPath = process.cwd();

		// 4. Future: stage / NODE_ENV resolution (not implemented yet)

		// 5. Retrieve environment variables
		const rawEnvs = { ...process.env };

		/**
		 * Final runtime bootstrap facts
		 *
		 * This object is:
		 * - Immutable after resolution
		 * - Shared across all managers
		 * - Used as base context for the entire runtime
		 */
		const runtime: RuntimeCoreFacts = {
			node,
			cwd: currentPath,
			script: {
				full: fullCommandLine,
				raw: script,
				name: scriptName,
				path: scriptPath,
				file: scriptFile,
				ext: scriptExt,
				args
			},
			envs: rawEnvs
		};

		return runtime;
	}
}
