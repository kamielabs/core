// NOTE:
// - This file defines the full immutable snapshot shape exposed by SnapshotService
// - It is a typed read-only view of the final merged core dictionaries
// - Used to expose stable runtime data to hooks and internal consumers

// WARNING:
// - This is a typing contract only
// - Any structural change in final data composition must be reflected here

import {
	CoreMetaShape,
	CLISettings,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	CoreModulesShapeDecl,
	CoreGlobalsDecl,
	CoreTranslationsDecl,
	CoreStagesShapeDecl,
	CoreEventsShapeDecl
} from "@types";

/**
 * SnapshotFullContext
 *
 * Full typed snapshot of the core declarative state.
 *
 * Purpose:
 * - Expose a stable view of final merged dictionaries
 * - Provide read access to core configuration/state without exposing managers
 *
 * Contents:
 * - CLI settings
 * - Final events dictionary
 * - Final stages dictionary
 * - Final translations dictionary
 * - Final globals dictionary
 * - Final modules dictionary
 *
 * @template TEvents - Custom events shape
 * @template TStages - Custom stages shape
 * @template TGlobals - Custom globals shape
 * @template TModules - Custom modules shape
 * @template TTranslations - Custom translations shape
 */
export type SnapshotFullContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = {
	/**
	 * Final Meta Informations
	 */
	meta: CoreMetaShape;
	/**
	 * Final CLI settings.
	 */
	settings: CLISettings

	/**
	 * Final merged events dictionary.
	 */
	events: CoreEventsShapeDecl<TEvents>;

	/**
	 * Final merged stages dictionary.
	 */
	stages: CoreStagesShapeDecl<TStages>;

	/**
	 * Final merged translations dictionary.
	 */
	i18n: CoreTranslationsDecl<TTranslations>;

	/**
	 * Final merged globals dictionary.
	 */
	globals: CoreGlobalsDecl<TGlobals>;

	/**
	 * Final merged modules dictionary.
	 */
	modules: CoreModulesShapeDecl<TModules>;
}
