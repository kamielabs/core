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
import { CoreError, CoreHelpers } from "@helpers";
import { CoreEventKind, CoreEventPhase, CoreEventLevel, CoreEventsShape, CoreEventsShapeDecl } from "@types";

/**
 * buildEvents
 *
 * Merges built-in events with user-defined custom events.
 *
 * Lifecycle position:
 * - executed during `CLI.init()` static bootstrap
 * - runs before managers exist
 * - cannot rely on the core event system yet
 * - therefore reports failures through `CoreError` only
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
 * Architectural note:
 * - unlike the other builders, this one is expected to remain relevant longer
 *   because events are the first real runtime brick of the core
 *
 * @template TCustom - Custom events shape
 * @param custom - Optional custom events definition
 *
 * @throws CoreError if a custom event overrides a built-in event
 *
 * @returns Merged events dictionary (builtins + custom)
 */
export function buildEvents<TCustom extends CoreEventsShape = {}>(custom?: TCustom): CoreEventsShapeDecl<TCustom> {
	/**
	 * Prevent override of built-in events.
	 *
	 * Invariant:
	 * - Built-in events are immutable and cannot be shadowed
	 * - 'CORE_' namespace is reserved for internal events
	 */
	const keyIndex = new Set<string>();
	const indexes = {
		byName: {} as Record<string, string>,
		byKind: {
			0: [],
			1: []
		} as Record<CoreEventKind, string[]>,
		byPhase: {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
			5: [],
			6: [],
			7: [],
			8: []
		} as Record<CoreEventPhase, string[]>,
		byLevel: {
			0: [],
			1: [],
			2: [],
			3: [],
			4: [],
			5: []
		} as Record<CoreEventLevel, string[]>
	}
	// 1. index builtins
	for (const [key, evt] of Object.entries(BUILTIN_EVENTS) as [
		keyof typeof BUILTIN_EVENTS,
		(typeof BUILTIN_EVENTS)[keyof typeof BUILTIN_EVENTS]
	][]) {

		/**
		 * Builtin key/name invariant.
		 */
		const expected = CoreHelpers.isValidRuntimeName(
			key as string,
			true
		);

		if (expected !== evt.name) {
			throw new CoreError(
				'eventInvalidKey',
				`Builtin event "${String(key)}" does not match runtime name "${evt.name}"\n Expected: ${expected}`
			);
		}

		keyIndex.add(key as string);
		indexes.byName[evt.name] = key;
		indexes.byKind[evt.kind].push(key);
		indexes.byPhase[evt.phase].push(key);
		indexes.byLevel[evt.level].push(key);
	}

	if (custom) {
		// 2. validate customs
		for (const key in custom) {
			const evt = custom[key];
			if (!evt) continue;

			const { name } = evt;
			/**
			 * Custom key/name invariant.
			 */
			const expected = CoreHelpers.isValidRuntimeName(
				key,
				false
			);

			if (expected !== name) {
				throw new CoreError(
					'eventInvalidKey',
					`Custom event "${key}" does not match runtime name "${name}"\n Expected: ${expected}`
				);
			}

			// 🔒 Builtin Key collision
			if (keyIndex.has(key)) {
				throw new CoreError(
					'eventDuplicatedKey',
					`Event key "${key}" already exists`
				);
			}

			// 🔒 Builtin Name collision
			if (indexes.byName[name]) {
				throw new CoreError(
					'eventDuplicatedName',
					`Event name "${name}" already exists`
				);
			}

			// 🔒 Reserved namespace
			if (name.startsWith('core.')) {
				throw new CoreError(
					'eventNamespace',
					`Event "${key}" cannot use reserved namespace 'core.'`
				);
			}

			// register
			keyIndex.add(key);
			indexes.byName[evt.name] = key;
			indexes.byKind[evt.kind].push(key);
			indexes.byPhase[evt.phase].push(key);
			indexes.byLevel[evt.level].push(key);
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
	} as const;

	const shape: CoreEventsShapeDecl<TCustom> = {
		list: merged as typeof BUILTIN_EVENTS & TCustom,
		indexes
	} as const;

	/**
	 * Type assertion ensures:
	 * - Built-in events are always present
	 * - Custom events are merged with correct typing
	 */
	return shape;
	// return merged as typeof BUILTIN_EVENTS & TCustom;
}

