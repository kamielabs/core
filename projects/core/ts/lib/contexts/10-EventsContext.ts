// NOTE:
// - This file defines hook-level method exposures for the Events system
// - It does NOT implement logic, only re-exports typed methods from EventsManager
// - Used by ToolsService to expose controlled capabilities to hooks

// WARNING:
// - These types directly mirror EventsManager methods
// - Any change in EventsManager signatures MUST be reflected here

import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types"

import { EventsManager } from "@managers"

/**
 * EmitSignalHookMethod
 *
 * Type alias for EventsManager.emitSignal.
 *
 * Exposed to hooks to emit low-level signals.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type EmitSignalHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	EventsManager<TEvents, TStages, TGlobals, TModules, TTranslations>['emitSignal'];

/**
 * EmitMessageHookMethod
 *
 * Type alias for EventsManager.emitMessage.
 *
 * Exposed to hooks to emit user-facing messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type EmitMessageHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	EventsManager<TEvents, TStages, TGlobals, TModules, TTranslations>['emitMessage'];

/**
 * SetOutputListenerMethod
 *
 * Type alias for EventsManager.setOutputListener.
 *
 * Allows hooks to register output listeners.
 *
 * WARNING:
 * - This impacts global output behavior
 * - Should be used carefully in hooks
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SetOutputListenerMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> =
	EventsManager<TEvents, TStages, TGlobals, TModules, TTranslations>['setOutputListener'];
