// NOTE:
// - This file defines the final execution hook context (action-level)
// - This is the MOST complete and stable hook context in the system
// - Used for actual business logic execution

// WARNING:
// - All properties are guaranteed to be present (fully resolved runtime)
// - This is the ONLY hook level where the full runtime is accessible
// - No direct mutation of runtime state is allowed

import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ParsedOptionValue,
	RuntimeFullFacts
} from "@types";

import {
	EmitMessageHookMethod,
	EmitSignalHookMethod,
	SnapshotFullContext
} from "@contexts";

import { ModulesManager } from "@managers";

/**
 * ModulesActionHookMethod
 *
 * Type alias for registering a custom action hook.
 *
 * Mirrors ModulesManager.registerCustomActionHook.
 */
export type ModulesActionHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	ModulesManager<TEvents, TStages, TGlobals, TModules, TTranslations>["registerCustomActionHook"];

/**
 * RuntimeFullContext
 *
 * Full resolved runtime facts available during action execution.
 *
 * This includes:
 * - bootstrap
 * - stage
 * - globals
 * - module
 * - action
 *
 * This is the most complete runtime view available in the system.
 */
export type RuntimeFullContext = RuntimeFullFacts;

/**
 * ToolsActionContext
 *
 * Controlled side-effect API exposed to action hooks.
 *
 * These tools are the ONLY allowed mutation surface.
 */
export type ToolsActionContext<
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
}

/**
 * ActionHook
 *
 * Definition of an action hook function.
 *
 * This is the final execution layer of the CLI.
 *
 * Characteristics:
 * - Fully resolved context (no optional fields)
 * - Full runtime access (read-only)
 * - Controlled side-effects via tools
 *
 * Context contains:
 * - options: resolved action options
 * - tools: side-effect API
 * - runtime: full runtime facts
 * - snapshot: full system snapshot
 */
export type ActionHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TOptions = Record<string, ParsedOptionValue>
> = (ctx: {
	/**
	 * Resolved action options.
	 */
	options: TOptions;

	/**
	 * Controlled tools for side-effects.
	 */
	tools: ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Full runtime facts (read-only).
	 */
	runtime: RuntimeFullContext;

	/**
	 * Full system snapshot.
	 */
	snapshot: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
}) => void | Promise<void>;

/**
 * RuntimeActionHook
 *
 * Generic fallback type for action hooks with dynamic options.
 *
 * Used when no specific option typing is required.
 */
export type RuntimeActionHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
> = ActionHook<
	TEvents,
	TStages,
	TGlobals,
	TModules,
	TTranslations,
	Record<string, ParsedOptionValue>
>;
