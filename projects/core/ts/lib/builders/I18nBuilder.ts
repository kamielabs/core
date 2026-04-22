// TODO: V0.1 — CORE_STATES integration may impact i18n resolution lifecycle
// NOTE:
// - Builders perform minimal validation only (no deep consistency checks)
// - Full runtime validation and usage guarantees are handled by I18nManager
// - Built-in messages are protected against override on a per-language basis

import { CoreError } from "@helpers";
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
	 * Fast path: no custom translations.
	 */
	if (!custom) {
		return builtins as BuiltinMessages & TCustom;
	}

	/**
	 * Validate overrides ONLY for built-in languages.
	 *
	 * Invariant:
	 * - Built-in message keys are immutable
	 * - Custom translations cannot override them
	 */
	for (const lang of Object.keys(custom) as Array<keyof TCustom>) {
		if (!(lang in builtins)) continue;

		const builtinLangDict = builtins[lang as keyof BuiltinMessages];
		const customLangDict = custom[lang];

		if (!customLangDict) continue;

		for (const key of Object.keys(customLangDict)) {
			if (key in builtinLangDict) {
				throw new CoreError(
					"I18N_MESSAGE_DUPLICATE",
					"i18Builder.buildTranslations",
					`Translation key "${key}" already exists in builtin lang "${String(lang)}" (override forbidden)`
				);
			}
		}
	}

	/**
	 * Merge translations per language.
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
