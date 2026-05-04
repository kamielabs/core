// NOTE:
// - Builders perform minimal validation only
// - Full validation (actions structure, flags, indexing, etc.) is handled by ModulesManager
// - Built-in modules ("help", "version") are RESERVED and cannot be overridden

// TODO: ARCHITECTURE (future)
// Evaluate moving validation + indexing into Builders instead of Managers

import { BUILTIN_MODULES } from "@data";
import { CoreModulesShape } from "@types";
import { CoreError } from "@helpers";

/**
 * buildModules
 *
 * Merges built-in modules with user-defined modules.
 *
 * Lifecycle position:
 * - executed during `CLI.init()` static bootstrap
 * - runs before managers exist
 * - cannot rely on the core event system yet
 * - therefore reports failures through `CoreError` only
 *
 * Responsibilities:
 * - Prevent override of reserved built-in modules ("help", "version")
 * - Perform shallow merge
 * - Preserve typing
 *
 * Non-responsibilities:
 * - No deep validation (actions, flags, structure)
 * - No index building
 * - No runtime guarantees
 *
 * These are handled later by ModulesManager.
 *
 * Architectural note:
 * - this builder is expected to disappear with RFC-0002 once validation/indexing
 *   fully moves into manager initialization
 *
 * @template TCustomModules - Custom modules shape
 * @param custom - Optional custom modules definition
 *
 * @throws CoreError if a reserved module is overridden
 *
 * @returns Merged modules dictionary (builtins + custom)
 */
export function buildModules<
	TCustomModules extends CoreModulesShape = {}
>(
	custom?: TCustomModules
) {

	/**
	 * Clone built-ins to avoid accidental mutation.
	 */
	const validatedBuiltins = { ...BUILTIN_MODULES };

	/**
	 * Prevent override of reserved modules.
	 *
	 * Invariant:
	 * - "help" and "version" are reserved
	 * - Users cannot redefine them
	 */
	if (custom) {
		for (const key in custom) {
			if (key === "help" || key === "version") {
				throw new CoreError(
					"modulesNamespace",
					`Module "${key}" is reserved and cannot be overridden`
				);
			}
		}
	}

	/**
	 * Fast path: no custom modules provided.
	 */
	if (!custom) {
		return validatedBuiltins as typeof BUILTIN_MODULES & TCustomModules;
	}

	/**
	 * Merge built-in and custom modules.
	 *
	 * NOTE:
	 * - Reserved modules are protected
	 * - Other modules are freely extendable
	 */
	const merged = {
		...validatedBuiltins,
		...custom
	} as const;

	return merged as typeof BUILTIN_MODULES & TCustomModules;
}
