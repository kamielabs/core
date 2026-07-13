// NOTE:
// - This file defines hook-level method exposures for the Events system
// - It does NOT implement logic, only re-exports typed methods from EventsManager
// - Used by ToolsService to expose controlled capabilities to hooks

// WARNING:
// - These types directly mirror EventsManager methods
// - Any change in EventsManager signatures MUST be reflected here

import {
	CLISettings,
	CoreEventsChannelsShape,
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	RuntimeAppShape,
} from "@types"

import { EventsManager, I18nManager } from "@managers"
import { CoreProviders } from "@providers";
import { CoreHelpers } from "@helpers";


export type EventsManagerContext<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> = {
	settings: CLISettings;
	providers: CoreProviders,
	helpers: {
		core: CoreHelpers
	},
	i18n: { tr: I18nManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>["tr"] }
}

/**
 * SignalTraceHookMethod
 *
 * Type alias for EventsManager.signalTrace.
 *
 * Exposed to hooks to emit "trace" level low-level signals.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SignalTraceHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['signalTrace'];

/**
 * SignalDebugHookMethod
 *
 * Type alias for EventsManager.signalDebug.
 *
 * Exposed to hooks to emit "debug" level low-level signals
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SignalDebugHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['signalDebug'];

/**
 * SignalInfoHookMethod
 *
 * Type alias for EventsManager.signalInfo.
 *
 * Exposed to hooks to emit "info" level low-level signals.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SignalInfoHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['signalInfo'];

/**
 * SignalWarnHookMethod
 *
 * Type alias for EventsManager.signalWarn.
 *
 * Exposed to hooks to emit "warning" level low-level signals.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SignalWarnHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['signalWarn'];

/**
 * SignalThrowHookMethod
 *
 * Type alias for EventsManager.signalThrow.
 *
 * Exposed to hooks to emit terminal signal events.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SignalThrowHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['signalThrow'];

/**
 * MessageTraceHookMethod
 *
 * Type alias for EventsManager.messageTrace.
 *
 * Exposed to hooks to emit "trace" level i18n-capable messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type MessageTraceHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['messageTrace'];

/**
 * MessageDebugHookMethod
 *
 * Type alias for EventsManager.messageDebug.
 *
 * Exposed to hooks to emit "debug" level i18n-capable messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type MessageDebugHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['messageDebug'];

/**
 * MessageInfoHookMethod
 *
 * Type alias for EventsManager.messageInfo.
 *
 * Exposed to hooks to emit "info" level i18n-capable messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type MessageInfoHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['messageInfo'];

/**
 * MessageWarnHookMethod
 *
 * Type alias for EventsManager.messageWarn.
 *
 * Exposed to hooks to emit "warning" level i18n-capable messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type MessageWarnHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['messageWarn'];

/**
 * MessageThrowHookMethod
 *
 * Type alias for EventsManager.messageThrow.
 *
 * Exposed to hooks to emit terminal i18n-capable messages.
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type MessageThrowHookMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['messageThrow'];
/**
 * SetOutputListenerMethod
 *
 * Type alias for EventsManager.setOutputListener.
 *
 * Allows hooks to register passive output listeners only.
 *
 * WARNING:
 * - This impacts global output behavior
 * - Should be used carefully in hooks
 * - Channels are reserved for output listeners and do not apply to flow listeners
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export type SetOutputListenerMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['setOutputListener'];



export type GetFilteredEventsMethod<
	TEvents extends CoreEventsShape,
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> =
	EventsManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>['getFilteredEvents'];

