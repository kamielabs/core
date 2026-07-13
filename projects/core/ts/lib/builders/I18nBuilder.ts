// NOTE:
// - Builders perform minimal validation only (no deep consistency checks)
// - Full runtime validation and usage guarantees are handled by I18nManager
// - Built-in messages are protected against override on a per-language basis

import { CoreError, CoreHelpers } from "@helpers";
import {
	CoreMessagesShape,
	CoreTranslationsShape
} from "@types";
import {
	BUILTIN_MESSAGES,
	BuiltinMessages
} from "@data";

/**
 * buildTranslations
 *
 * Builds the final translations dictionary by merging built-in messages
 * with user-provided custom translations.
 *
 * Lifecycle position:
 * - executed during `CLI.init()` static bootstrap
 * - runs before managers exist
 * - cannot rely on the core event system yet
 * - therefore reports failures through `CoreError` only
 *
 * Responsibilities:
 * - Prevent override of existing built-in message keys (per language)
 * - Merge built-in and custom translations
 * - Support addition of entirely new languages
 *
 * Rules:
 * - Built-in languages:
 *   - Existing keys CANNOT be overridden
 *   - New keys CAN be added
 * - Custom-only languages:
 *   - Fully accepted without restriction
 *
 * Non-responsibilities:
 * - No deep validation (missing keys, fallback logic, etc.)
 * - No runtime guarantees
 *
 * These are handled later by the I18nManager.
 *
 * Architectural note:
 * - this builder is expected to disappear with RFC-0002 once validation/indexing
 *   fully moves into manager initialization
 *
 * @template TCustom - Custom translations shape
 * @param custom - Optional custom translations dictionary
 *
 * @throws CoreError if a custom translation overrides a built-in key
 *
 * @returns Final merged translations dictionary
 */
export function buildTranslations<TCustom extends CoreTranslationsShape = {}>(
	custom?: TCustom
) {

	const builtins = BUILTIN_MESSAGES;

	/**
	 * ------------------------------------------------------------------
	 * 1. Validate builtin translations
	 * ------------------------------------------------------------------
	 */
	for (const lang of Object.keys(builtins) as Array<keyof BuiltinMessages>) {

		const builtinLangDict = builtins[lang];

		for (const key of Object.keys(builtinLangDict) as Array<keyof typeof builtinLangDict>) {

			const msg = builtinLangDict[key];

			if (!msg) continue;

			/**
			 * Builtin key/name invariant.
			 */
			const expected = CoreHelpers.isValidRuntimeName(
				key,
				true
			);

			if (expected !== msg.name) {
				throw new CoreError(
					"i18nInvalidKey",
					`Builtin translation "${key}" does not match runtime name "${msg.name}"\n Expected: ${expected}`
				);
			}
		}
	}

	/**
	 * Fast path: no custom translations.
	 */
	if (!custom) {
		return builtins as BuiltinMessages & TCustom;
	}

	/**
	 * ------------------------------------------------------------------
	 * 2. Validate custom translations
	 * ------------------------------------------------------------------
	 */
	for (const lang of Object.keys(custom) as Array<keyof TCustom>) {

		const customLangDict = custom[lang];

		if (!customLangDict) continue;

		/**
		 * Builtin language collision checks.
		 */
		if (lang in builtins) {

			const builtinLangDict = builtins[lang as keyof BuiltinMessages];

			for (const key of Object.keys(customLangDict)) {

				/**
				 * Builtin keys are immutable.
				 */
				if (key in builtinLangDict) {
					throw new CoreError(
						"i18nMessageDuplicated",
						`Translation key "${key}" already exists in builtin lang "${String(lang)}" (override forbidden)`
					);
				}
			}
		}

		/**
		 * Validate custom translation invariants.
		 */
		for (const key of Object.keys(customLangDict)) {

			const msg = customLangDict[key];

			if (!msg) continue;

			/**
			 * Custom namespace restriction.
			 */
			if (msg.name.startsWith("core.")) {
				throw new CoreError(
					"i18nNameSpace",
					`Custom translation "${key}" cannot use reserved namespace 'core.'`
				);
			}

			/**
			 * Custom key/name invariant.
			 */
			const expected = CoreHelpers.isValidRuntimeName(
				key,
				false
			);


			if (expected !== msg.name) {
				throw new CoreError(
					"i18nInvalidKey",
					`Custom translation "${key}" does not match runtime name "${msg.name}"\n Expected: ${expected}`
				);
			}
		}
	}

	/**
	 * ------------------------------------------------------------------
	 * 3. Merge translations
	 * ------------------------------------------------------------------
	 */
	const merged: CoreTranslationsShape = {};

	/**
	 * Step 1:
	 * Merge built-in languages with optional custom extensions.
	 */
	for (const lang of Object.keys(builtins) as Array<keyof BuiltinMessages>) {

		merged[lang] = {
			...builtins[lang],
			...(custom[lang as keyof TCustom] ?? {})
		};
	}

	/**
	 * Step 2:
	 * Add custom-only languages.
	 */
	for (const lang of Object.keys(custom) as Array<keyof TCustom>) {

		if (lang in builtins) continue;

		merged[String(lang)] = custom[lang] as CoreMessagesShape;
	}

	return merged as BuiltinMessages & TCustom;
}
