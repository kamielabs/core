// NOTE:
// - This file defines the final execution hook context (action-level)
// - This is the MOST complete and stable hook context in the system
// - Used for actual business logic execution

// WARNING:
// - All properties are guaranteed to be present (fully resolved runtime)
// - This is the ONLY hook level where the full runtime is accessible
// - No direct mutation of runtime state is allowed

import {
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ParsedOptionValue,
	RuntimeAppShape,
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
	ResolvePathHelperMethod,
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	ModulesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["registerCustomActionHook"];

export type BeforeActionHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	ModulesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["registerBeforeActionHook"]

export type AfterActionHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	ModulesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["registerAfterActionHook"]

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
export type RuntimeFullContext<TApp extends RuntimeAppShape> = RuntimeFullFacts & { app: TApp };

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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	/**
	 * Emit a signal event.
	 */
	signal: {
		trace: SignalTraceHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		debug: SignalDebugHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		info: SignalInfoHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		warn: SignalWarnHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		throw: SignalThrowHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	};
	/**
	 * Emit a user-facing message.
	 */
	message: {
		trace: MessageTraceHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		debug: MessageDebugHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		info: MessageInfoHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		warn: MessageWarnHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		throw: MessageThrowHookMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	};
	events: {
		get: GetFilteredEventsMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	};
	paths: {
		resolve: ResolvePathHelperMethod;
	}
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
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
	tools: ToolsActionContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	/**
	 * Full runtime facts (read-only).
	 */
	runtime: RuntimeFullContext<TApp>;

	/**
	 * Full system snapshot.
	 */
	snapshot: SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations>;

	live: LiveActionContext;
}) => void | Promise<void>;

export type RuntimeHook<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
> = (ctx: {
	tools: ToolsActionContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	runtime: RuntimeFullContext<TApp>;
	snapshot: SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations>;
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = ActionHook<
	TEvents,
	TChannels,
	TStages,
	TGlobals,
	TModules,
	TTranslations,
	TApp,
	Record<string, ParsedOptionValue>
>;
