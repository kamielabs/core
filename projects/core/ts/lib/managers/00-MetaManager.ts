// NOTE:
// - V0.1: metadata is manually defined (static values)
// - No dynamic resolution (git, build, etc.)

// TODO: V0.1 — Add setters to allow CLI.init() to override meta (name, version, author)
// TODO: V2.0 — Connect MetaManager to git versioning, build number, commit hash, etc.

import { Context } from "@contexts";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreMetaShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types";


/**
 * MetaManager
 *
 * Responsible for storing and exposing metadata related to:
 * - the core framework
 * - the CLI using the framework
 *
 * Responsibilities:
 * - Provide a central metadata dictionary
 * - Expose a read-only metadata snapshot to the rest of the core
 *
 * Current behavior (v0.1):
 * - Static initialization only
 * - No dynamic updates after construction
 * - No runtime resolution logic yet
 *
 * Future (v2):
 * - Auto-injection from git (version, commit hash, build number)
 * - CLI metadata override during initialization
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class MetaManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {

	private _ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>;
	private _meta: CoreMetaShape;

	constructor(ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>, cliMeta?: Partial<CoreMetaShape["cli"]>) {
		this._ctx = ctx;
		this._meta = {
			core: {
				version: "0.1.0-rc.2",
				author: "k4mie"
			},
			cli: {
				name: cliMeta?.name,
				version: cliMeta?.version,
				author: cliMeta?.author
			}
		} satisfies CoreMetaShape;
	}

	public init: () => Promise<void> = async (): Promise<void> => { };

	/**
	 * Return a read-only metadata snapshot.
	 *
	 * This manager currently acts as a thin storage layer until future versions
	 * introduce automatic core and CLI metadata resolution/versioning.
	 */
	public getMeta(): Readonly<CoreMetaShape> {
		const meta = this._ctx.helpers.core.deepClone(this._meta);
		this._ctx.helpers.core.deepFreeze(meta);
		return meta;
	}
}
