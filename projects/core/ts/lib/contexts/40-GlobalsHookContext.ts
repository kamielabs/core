// NOTE:
// - This file defines the hook context for globals resolution phase
// - It exposes a controlled execution environment for global-level hooks
// - Used internally by ToolsService to provide a safe API surface

// WARNING:
// - No direct mutation of runtime state is allowed
// - All side-effects must go through provided tools
// - Runtime data is read-only and reflects resolved state

import {
	GlobalsManager
} from "@managers";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ExtractGlobals,
	RuntimeCoreFacts,
	RuntimeGlobalsFacts,
	RuntimeStageFacts
} from "@types";
import { SnapshotFullContext } from "./20-SnapshotContext";
import { EmitMessageHookMethod, EmitSignalHookMethod, SetOutputListenerMethod } from "./10-EventsContext";

/**
 * GlobalsHookMethod
 *
 * Type alias for registering a custom globals hook.
 *
 * Mirrors GlobalsManager.customHook method.
 */
export type GlobalsHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = GlobalsManager<TEvents, TStages, TGlobals, TModules, TTranslations>["customHook"]

/**
 * RuntimeGlobalsContext
 *
 * Read-only runtime facts available during globals hook execution.
 *
 * Contains:
 * - bootstrap facts
 * - current stage facts
 * - resolved globals facts
 */
export type RuntimeGlobalsContext = {
	/**
	 * Core bootstrap facts (platform, env, etc.)
	 */
	bootstrap: RuntimeCoreFacts;

	/**
	 * Current resolved stage facts
	 */
	stage: RuntimeStageFacts;

	/**
	 * Current resolved globals facts
	 */
	globals: RuntimeGlobalsFacts;
};

/**
 * ToolsGlobalsContext
 *
 * Controlled side-effect API exposed to globals hooks.
 *
 * These tools are the ONLY allowed mutation surface.
 */
export type ToolsGlobalsContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = {
	/**
	 * Emit a signal event.
	 */
	signal: EmitSignalHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Emit a user-facing message.
	 */
	message: EmitMessageHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Register an output listener.
	 *
	 * WARNING:
	 * - Impacts global output behavior
	 */
	addListener: SetOutputListenerMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
}

/**
 * GlobalsHookContext
 *
 * Full context passed to a globals hook.
 *
 * Contains:
 * - resolved global options
 * - runtime facts
 * - tools for side-effects
 * - snapshot of full system state
 */
export type GlobalsHookContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TGlobalOptions = ExtractGlobals<TGlobals>
> = {
	/**
	 * Resolved global options.
	 */
	options: TGlobalOptions;

	/**
	 * Runtime facts (read-only).
	 */
	runtime: RuntimeGlobalsContext;

	/**
	 * Controlled tools for side-effects.
	 */
	tools: ToolsGlobalsContext<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Full system snapshot.
	 */
	snapshot: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
};

/**
 * GlobalsHook
 *
 * Definition of a globals hook function.
 *
 * Executed after:
 * - global options resolution
 * - environment variable parsing
 * - CLI flag parsing
 *
 * Notes:
 * - Can be sync or async
 * - Must not mutate runtime directly
 * - Must use provided tools for side-effects
 */
export type GlobalsHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TGlobalOtions = ExtractGlobals<TGlobals>
> = (
	ctx: GlobalsHookContext<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations,
		TGlobalOtions
	>
) => void | Promise<void>;
