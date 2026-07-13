import { CoreEventsChannelsShape } from "@types";

export const BUILTIN_EVENTS_CHANNELS = {
	default: {
		description: "Default Terminal Output"
	}
} as const satisfies CoreEventsChannelsShape

/**
 * Concrete builtin event dictionary type inferred from `BUILTIN_EVENTS_CHANNELS`.
 */
export type BuiltinEventsChannels = typeof BUILTIN_EVENTS_CHANNELS;

/**
 * Final channels dictionary shape once builtin and custom events are merged.
 */
export type FinalEventsChannels<TChannels extends CoreEventsChannelsShape> = BuiltinEventsChannels & TChannels;
