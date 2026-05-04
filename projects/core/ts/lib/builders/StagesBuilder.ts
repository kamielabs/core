// NOTE:
// - This builder performs STRUCTURAL validation (required fields, invariants)
// - No runtime indexing or deep validation is performed here
// - StagesManager remains responsible for runtime validation and resolution

// TODO: ARCHITECTURE (future)
// Evaluate whether stage validation should remain here or be unified with CORE_STATES system

import { BUILTIN_STAGES, LANG_ENV } from "@data";
import { CoreError } from "@helpers";
import { CoreStagesShape } from "@types";

/**
 * Type guard to check if a stage is a built-in stage.
 *
 * @param name - Stage name
 * @returns True if the stage is built-in
 */
function isBuiltinStage(
	name: string
): name is keyof typeof BUILTIN_STAGES {
	return name in BUILTIN_STAGES;
}

/**
 * buildStages
 *
 * Builds the final stages dictionary by merging built-in stages
 * with user-defined custom stages.
 *
 * Lifecycle position:
 * - executed during `CLI.init()` static bootstrap
 * - runs before managers exist
 * - cannot rely on the core event system yet
 * - therefore reports failures through `CoreError` only
 *
 * Responsibilities:
 * - Validate structural integrity of custom stages
 * - Enforce invariants for built-in stage extension
 * - Prevent invalid overrides
 * - Merge built-in and custom stages
 *
 * Rules:
 *
 * 1. Built-in stages:
 *    - Cannot override "file"
 *    - Cannot override existing options
 *    - Can EXTEND options only
 *
 * 2. Custom stages:
 *    - Must define a "file"
 *    - Must define a "lang" option
 *    - "lang.env" must match LANG_ENV
 *
 * Non-responsibilities:
 * - No indexing
 * - No runtime resolution
 * - No deep validation beyond required structure
 *
 * These are handled later by StagesManager.
 *
 * Architectural note:
 * - this builder is expected to disappear with RFC-0002 once validation/indexing
 *   fully moves into manager initialization
 *
 * @template TCustomStages - Custom stages shape
 * @param custom - Optional custom stages definition
 *
 * @throws CoreError on:
 * - Built-in override attempts
 * - Missing required fields
 * - Invalid "lang" configuration
 *
 * @returns Final merged stages dictionary
 */
export function buildStages<TCustomStages extends CoreStagesShape = {}>(
	custom?: TCustomStages
) {

	/**
	 * Clone built-in stages to avoid mutation.
	 */
	const validatedBuiltins: CoreStagesShape = { ...BUILTIN_STAGES };

	/**
	 * Container for validated custom stages.
	 */
	const validatedCustoms: CoreStagesShape = {};

	/**
	 * Fast path: no custom stages provided.
	 */
	if (!custom) {
		return validatedBuiltins as typeof BUILTIN_STAGES & TCustomStages;
	}

	/**
	 * Validate and process each custom stage.
	 */
	for (const stageName in custom) {

		const customStage = custom[stageName];

		if (!customStage) continue;

		// ─────────────────────────────
		// BUILTIN EXTENSION
		// ─────────────────────────────

		/**
		 * Extending an existing built-in stage.
		 */
		if (isBuiltinStage(stageName)) {
			const builtin = BUILTIN_STAGES[stageName];

			/**
			 * Invariant:
			 * - Built-in "file" cannot be overridden
			 */
			if ("file" in customStage) {
				throw new CoreError(
					"stageFileDuplicated",
					`Stage "${stageName}" cannot override builtin "file"`
				);
			}

			/**
			 * Invariant:
			 * - Built-in options cannot be overridden
			 */
			for (const propName in customStage.options) {
				if (propName in builtin.options) {
					throw new CoreError(
						"stagePropDuplicated",
						`Stage "${stageName}" prop "${propName}" already exists in builtin props`
					);
				}
			}

			/**
			 * Extend built-in stage with additional options.
			 */
			validatedBuiltins[stageName] = {
				file: builtin.file,
				options: {
					...builtin.options,
					...customStage.options
				}
			};

			continue;
		}

		// ─────────────────────────────
		// CUSTOM STAGE
		// ─────────────────────────────

		/**
		 * Invariant:
		 * - Custom stages must define a file
		 */
		if (!customStage.file) {
			throw new CoreError(
				"stageFileMissing",
				`Custom stage "${stageName}" must declare a "file"`
			);
		}

		/**
		 * Invariant:
		 * - Custom stages must define a valid "lang" option
		 */
		const langOpt = customStage.options?.lang;

		if (!langOpt || langOpt.env !== LANG_ENV) {
			throw new CoreError(
				"stageLangMissing",
				`Custom stage "${stageName}" must declare a "lang" option with env "${LANG_ENV}"`
			);
		}

		/**
		 * Accept validated custom stage.
		 */
		validatedCustoms[stageName] = customStage;
	}

	// ─────────────────────────────
	// FINAL MERGE
	// ─────────────────────────────

	/**
	 * Merge validated built-in and custom stages.
	 */
	const merged = {
		...validatedBuiltins,
		...validatedCustoms
	};

	return merged as typeof BUILTIN_STAGES & TCustomStages;
}
