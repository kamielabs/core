// NOTE: Builders Role
// - Builders perform lightweight pre-checks only (e.g. duplicate prevention with builtins)
// - Full validation (format, indexing, invariants) MUST be done in the corresponding Manager (EventsManager)
// - Managers are the single source of truth for runtime validation logic

// TODO: ARCHITECTURE (future)
// Two possible directions:
// 1. Keep current model:
//    - Builders: minimal pre-checks + merge
//    - Managers: full validation + index construction (current approach)
// 2. Move full validation + indexing into Builders:
//    - Builders produce fully validated + indexed structures
//    - Managers become pure consumers
// → Trade-off to evaluate: separation of concerns vs faster init & simpler Managers

import { BUILTIN_EVENTS_CHANNELS, FinalEventsChannels } from "@data";
import { CoreError } from "@helpers";
import { CoreEventsChannelsShape } from "@types";

/**
 * buildEvents
 *
 * Merges built-in channels with user-defined custom channels.
 *
 * Lifecycle position:
 * - executed during `CLI.init()` static bootstrap
 * - runs before managers exist
 * - cannot rely on the core event system yet
 * - therefore reports failures through `CoreError` only
 *
 * Responsibilities:
 * - Prevent overriding of built-in channels
 * - Perform shallow merge
 * - Preserve strong typing via intersection
 *
 * Non-responsibilities:
 * - No deep validation (format, structure, etc.)
 * - No indexing
 * - No runtime guarantees
 *
 * These are handled later by the EventsManager during initialization.
 *
 * @template TCustom - Custom channels shape
 * @param custom - Optional custom channels definition
 *
 * @throws CoreError if a custom channel overrides a built-in event
 *
 * @returns Merged channels dictionary (builtins + custom)
 */
export function buildChannels<TCustom extends CoreEventsChannelsShape = {}>(custom?: TCustom): FinalEventsChannels<TCustom> {
	/**
	 * Prevent override of built-in channels.
	 *
	 * Invariant:
	 * - Built-in channels are immutable and cannot be shadowed
	 */

	if (custom) {
		// validate customs
		for (const key in custom) {
			const channel = custom[key];
			if (!channel) continue;

			if (key in BUILTIN_EVENTS_CHANNELS) {
				throw new CoreError(
					'channelDuplicateName',
					`Channel name "${key}" already exists`
				);
			}

		}
	}

	/**
	 * Merge built-in and custom channels.
	 *
	 * NOTE: Custom events extend built-ins, Order ensures built-ins cannot be overridden
	 */
	return {
		...BUILTIN_EVENTS_CHANNELS,
		...(custom ?? {}),
	} as FinalEventsChannels<TCustom>;
}

