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
	RuntimeCoreEvent,
	RuntimeFullFacts
} from "@types";

import {
	GetFilteredEventsMethod,
	MessageDebugHookMethod,
	MessageInfoHookMethod,
	MessageThrowHookMethod,
	MessageTraceHookMethod,
	MessageWarnHookMethod,
	SignalDebugHookMethod,
	SignalInfoHookMethod,
	SignalThrowHookMethod,
	SignalTraceHookMethod,
	SignalWarnHookMethod,
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

export type BeforeActionHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	ModulesManager<TEvents, TStages, TGlobals, TModules, TTranslations>["registerBeforeActionHook"]

export type AfterActionHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	ModulesManager<TEvents, TStages, TGlobals, TModules, TTranslations>["registerAfterActionHook"]

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
// export type ToolsActionContext<
// 	TEvents extends CoreEventsShape,
// 	TStages extends CoreStagesShape,
// 	TGlobals extends CoreGlobalsShape,
// 	TModules extends CoreModulesShape,
// 	TTranslations extends CoreTranslationsShape
// > = {
// 	/**
// 	 * Emit a signal event.
// 	 */
// 	signal: EmitSignalHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
//
// 	/**
// 	 * Emit a user-facing message.
// 	 */
// 	message: EmitMessageHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
// }
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
	signal: {
		trace: SignalTraceHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		debug: SignalDebugHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		info: SignalInfoHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		warn: SignalWarnHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		throw: SignalThrowHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
	};
	/**
	 * Emit a user-facing message.
	 */
	message: {
		trace: MessageTraceHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		debug: MessageDebugHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		info: MessageInfoHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		warn: MessageWarnHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
		throw: MessageThrowHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
	};
	getEvents: GetFilteredEventsMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;
}

export type LiveActionContext = {
	events: RuntimeCoreEvent<string>[]
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

	args: string[];
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

	live: LiveActionContext;
}) => void | Promise<void>;

export type RuntimeHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = (ctx: {
	tools: ToolsActionContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
	runtime: RuntimeFullContext;
	snapshot: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
	live: LiveActionContext;
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
