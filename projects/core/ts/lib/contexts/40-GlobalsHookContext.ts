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
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ExtractGlobals,
	RuntimeAppShape,
	RuntimeCoreFacts,
	RuntimeGlobalsFacts,
	RuntimeStageFacts
} from "@types";
import {
	SnapshotFullContext,
	SetOutputListenerMethod,
	SignalTraceHookMethod,
	SignalDebugHookMethod,
	SignalInfoHookMethod,
	SignalWarnHookMethod,
	SignalThrowHookMethod,
	MessageTraceHookMethod,
	MessageDebugHookMethod,
	MessageInfoHookMethod,
	MessageWarnHookMethod,
	MessageThrowHookMethod,
	ResolvePathHelperMethod,
	GetFilteredEventsMethod
} from "@contexts";

/**
 * GlobalsHookMethod
 *
 * Type alias for registering a custom globals hook.
 *
 * Mirrors GlobalsManager.customHook method.
 */
export type GlobalsHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = GlobalsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["customHook"]

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
export type RuntimeGlobalsContext<TApp extends RuntimeAppShape> = {
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

	app: TApp;
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {

	/*
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
	/**
	 * Register an output listener.
	 *
	 * WARNING:
	 * - Impacts global output behavior
	 * - Registers passive output listeners only, never flow listeners
	 */
	events: {
		get: GetFilteredEventsMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
		addListener: SetOutputListenerMethod<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	};
	paths: {
		resolve: ResolvePathHelperMethod;
	}
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
	TGlobalOptions = ExtractGlobals<TGlobals>
> = {
	/**
	 * Resolved global options.
	 */
	options: TGlobalOptions;

	/**
	 * Runtime facts (read-only).
	 */
	runtime: RuntimeGlobalsContext<TApp>;

	/**
	 * Controlled tools for side-effects.
	 */
	tools: ToolsGlobalsContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	/**
	 * Full system snapshot.
	 */
	snapshot: SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations>;
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
 * - before runtime globals are frozen as the final resolved snapshot
 *
 * Notes:
 * - Can be sync or async
 * - Must not mutate runtime directly
 * - Must use provided tools for side-effects
 */
export type GlobalsHook<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
	TGlobalOtions = ExtractGlobals<TGlobals>
> = (
	ctx: GlobalsHookContext<
		TEvents,
		TChannels,
		TStages,
		TGlobals,
		TModules,
		TTranslations,
		TApp,
		TGlobalOtions
	>
) => void | Promise<void>;
