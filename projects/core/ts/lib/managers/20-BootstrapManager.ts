import { dirname } from "node:path"; // Put this in providers ??

import { ResolverManager } from "@abstracts";
import { Context } from "@contexts";
import {
	CoreEventsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreGlobalsShape,
	RuntimeCoreFacts,
	CoreTranslationsShape
} from "@types";

/**
 * BootstrapManager
 *
 * First resolution step of the core runtime.
 *
 * Responsibilities:
 * - Extract raw execution context from Node.js
 * - Normalize CLI invocation data (argv, script, cwd)
 * - Expose environment variables
 *
 * Important:
 * - This is the VERY FIRST runtime resolver
 * - No dependency on other managers
 * - No parsing logic here (pure data extraction)
 *
 * Lifecycle:
 * - Called during runtime.setBootstrap()
 * - Emits bootstrapInit event
 * - Produces RuntimeCoreFacts
 *
 * Design philosophy:
 * - Deterministic
 * - Zero external dependency
 * - Platform-agnostic (for now)
 *
 * Notes:
 * - Current implementation is minimal (v0.1)
 * - Will evolve into a full platform/shell abstraction layer
 */
export class BootstrapManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends ResolverManager<RuntimeCoreFacts, TEvents, TStages, TGlobals, TModules, TTranslations> {

	constructor(protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>) {
		super(ctx);
	}

	/**
	 * Resolve bootstrap facts
	 *
	 * Steps:
	 * 1. Emit bootstrap initialization event
	 * 2. Load raw runtime data
	 * 3. Store resolved facts in RuntimeService
	 *
	 * Notes:
	 * - No validation here
	 * - No transformation beyond minimal normalization
	 */
	public async resolve(): Promise<void> {
		await this.ctx.events.internalEmit('bootstrapInit', {
			details: ["System:", "Gentoo Linux"]
		});

		this.setResolved(this._load());
	}

	/**
	 * Load raw execution environment
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
	 *
	 * Output:
	 * - RuntimeCoreFacts (immutable runtime snapshot)
	 *
	 * This method defines the ROOT of runtime truth.
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
