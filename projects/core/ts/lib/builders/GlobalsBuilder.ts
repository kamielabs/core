// TODO: V0.1 — CORE_STATES integration may impact Globals validation flow
// NOTE: Builders Role
// - Builders perform minimal checks only
// - Full validation (structure, duplicates, indexing) is handled by GlobalsManager
// - "core" namespace is RESERVED and cannot be overridden or extended

// TODO: ARCHITECTURE (future)
// Evaluate moving validation + indexing into Builders instead of Managers
// (Builders = full producers, Managers = consumers)

import { BUILTIN_GLOBALS } from "@data";
import { CoreGlobalsShape } from "@types";
import { CoreError } from "@helpers";

/**
 * buildGlobals
 *
 * Merges built-in globals with user-defined globals.
 *
 * Responsibilities:
 * - Prevent usage of reserved "core" namespace
 * - Perform shallow merge
 * - Preserve typing
 *
 * Non-responsibilities:
 * - No deep validation (structure, constraints)
 * - No index building
 * - No duplicate detection at option level
 *
 * These are handled by GlobalsManager during initialization.
 *
 * @template TCustomGlobals - Custom globals shape
 * @param custom - Optional custom globals definition
 *
 * @throws CoreError if "core" namespace is defined in custom globals
 *
 * @returns Merged globals dictionary (builtins + custom)
 */
export function buildGlobals<TCustomGlobals extends CoreGlobalsShape = {}>(
	custom?: TCustomGlobals
) {

	/**
	 * Clone built-ins to avoid accidental mutation.
	 */
	const validatedBuiltins = { ...BUILTIN_GLOBALS };

	/**
	 * Prevent override or extension of reserved "core" namespace.
	 *
	 * Invariant:
	 * - "core" is reserved for internal globals only
	 * - Users cannot define or extend this group
	 */
	if (custom && "core" in custom) {
		throw new CoreError(
			"GLOBAL_RESERVED_NAMESPACE",
			"GlobalsBuilder.buildGlobals",
			`"core" namespace is reserved and cannot be defined in custom globals`
		);
	}

	/**
	 * Fast path: no custom globals provided.
	 */
	if (!custom) {
		return validatedBuiltins as typeof BUILTIN_GLOBALS & TCustomGlobals;
	}

	/**
	 * Merge built-in and custom globals.
	 *
	 * NOTE: No override of built-ins possible due to "core" protection, other groups are freely extendable
	 */
	const merged = {
		...validatedBuiltins,
		...(custom ?? {})
	};

	return merged as typeof BUILTIN_GLOBALS & TCustomGlobals;
}
