// NOTE:
// - This file defines the hook context for module-level execution
// - Provides a controlled API surface for module hooks
// - Used internally by ModulesManager and ToolsService

// WARNING:
// - All properties are optional (early lifecycle / partial context scenarios)
// - Hooks must defensively check availability before usage
// - No direct mutation of runtime state is allowed

import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ParsedOptionValue,
	RuntimeCoreFacts,
	RuntimeGlobalsFacts,
	RuntimeModuleFacts,
	RuntimeStageFacts
} from "@types";
import {
	EmitMessageHookMethod,
	EmitSignalHookMethod,
	SnapshotFullContext
} from "@contexts";
import { ModulesManager } from "@managers";

/**
 * ModulesHookMethod
 *
 * Type alias for registering a custom module hook.
 *
 * Mirrors ModulesManager.registerCustomModuleHook.
 */
export type ModulesHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	ModulesManager<TEvents, TStages, TGlobals, TModules, TTranslations>["registerCustomModuleHook"];

/**
 * ToolsModuleContext
 *
 * Controlled side-effect API exposed to module hooks.
 *
 * These tools are the ONLY allowed mutation surface.
 */
export type ToolsModuleContext<
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
 * RuntimeModuleContext
 *
 * Read-only runtime facts available during module hook execution.
 *
 * Contains:
 * - bootstrap facts
 * - stage facts
 * - globals facts
 * - current module facts
 */
export type RuntimeModuleContext = {
	bootstrap: RuntimeCoreFacts;
	stage: RuntimeStageFacts;
	globals: RuntimeGlobalsFacts;
	module: RuntimeModuleFacts;
}

/**
 * ModuleHook
 *
 * Definition of a module hook function.
 *
 * Characteristics:
 * - Context properties are optional (depending on lifecycle phase)
 * - Can be sync or async
 * - Must not mutate runtime directly
 * - Must use provided tools for side-effects
 *
 * Context contains:
 * - options: resolved module options
 * - tools: side-effect API
 * - runtime: read-only runtime facts
 * - snapshot: full system snapshot
 */
export type ModuleHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TOptions = Record<string, ParsedOptionValue>
> = (ctx: {
	/**
	 * Resolved module options.
	 */
	options?: TOptions;

	/**
	 * Controlled tools for side-effects.
	 */
	tools?: ToolsModuleContext<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Runtime facts (read-only).
	 */
	runtime?: RuntimeModuleContext;

	/**
	 * Full system snapshot.
	 */
	snapshot?: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
}) => void | Promise<void>;
