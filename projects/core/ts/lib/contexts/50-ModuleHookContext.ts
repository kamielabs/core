// NOTE:
// - This file defines the hook context for module-level execution
// - Provides a controlled API surface for module hooks
// - Used internally by ModulesManager and ToolsService

// WARNING:
// - Hook payload is currently exposed with optional properties on the public type surface
// - This reflects the current public API shape
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
	RuntimeCoreFacts,
	RuntimeGlobalsFacts,
	RuntimeModuleFacts,
	RuntimeStageFacts
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
 * ModulesHookMethod
 *
 * Type alias for registering a custom module hook.
 *
 * Mirrors ModulesManager.registerCustomModuleHook.
 */
export type ModulesHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	ModulesManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["registerCustomModuleHook"];

/**
 * ToolsModuleContext
 *
 * Controlled side-effect API exposed to module hooks.
 *
 * These tools are the ONLY allowed mutation surface.
 */
export type ToolsModuleContext<
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
	},

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
export type RuntimeModuleContext<TApp extends RuntimeAppShape> = {
	bootstrap: RuntimeCoreFacts;
	stage: RuntimeStageFacts;
	globals: RuntimeGlobalsFacts;
	module: RuntimeModuleFacts;
	app: TApp;
}

/**
 * ModuleHook
 *
 * Definition of a module hook function.
 *
 * Characteristics:
 * - Context properties are currently typed as optional on the public surface
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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape,
	TOptions = Record<string, ParsedOptionValue>
> = (ctx: {
	/**
	 * Resolved module options.
	 */
	options?: TOptions;

	/**
	 * Controlled tools for side-effects.
	 */
	tools?: ToolsModuleContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;

	/**
	 * Runtime facts (read-only).
	 */
	runtime?: RuntimeModuleContext<TApp>;

	/**
	 * Full system snapshot.
	 */
	snapshot?: SnapshotFullContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations>;
}) => void | Promise<void>;
