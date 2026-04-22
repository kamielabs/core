// TODO: V0.1 — CORE_STATES integration may require validation hooks alignment with EventsManager
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

import { BUILTIN_EVENTS } from "@data";
import { CoreError } from "@helpers";
import { CoreEventsShape } from "@types";

/**
 * buildEvents
 *
 * Merges built-in events with user-defined custom events.
 *
 * Responsibilities:
 * - Prevent overriding of built-in events
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
 * @template TCustom - Custom events shape
 * @param custom - Optional custom events definition
 *
 * @throws CoreError if a custom event overrides a built-in event
 *
 * @returns Merged events dictionary (builtins + custom)
 */
export function buildEvents<TCustom extends CoreEventsShape = {}>(custom?: TCustom) {
	/**
	 * Prevent override of built-in events.
	 *
	 * Invariant:
	 * - Built-in events are immutable and cannot be shadowed
	 */
	if (custom) {
		for (const key in custom) {
			if (key in BUILTIN_EVENTS) {
				throw new CoreError(
					"EVENT_DUPLICATE",
					"EventsBuilder.buildEvents",
					`Event "${key}" already exists in builtins (override forbidden)`
				);
			}
		}
	}

	/**
	 * Merge built-in and custom events.
	 *
	 * NOTE: Custom events extend built-ins, Order ensures built-ins cannot be overridden
	 */
	const merged = {
		...BUILTIN_EVENTS,
		...(custom ?? {})
	};

	/**
	 * Type assertion ensures:
	 * - Built-in events are always present
	 * - Custom events are merged with correct typing
	 */
	return merged as typeof BUILTIN_EVENTS & TCustom;
}
