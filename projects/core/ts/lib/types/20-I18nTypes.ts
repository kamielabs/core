import { FinalTranslations } from "@data";

/**
 * Minimal shared shape for all translated messages.
 *
 * The `code` is the canonical runtime identifier used by:
 * - translation indexes
 * - fallback resolution
 * - console rendering of message events
 */
export type CoreBaseMessage<Name extends string> = {
	name: Name;
}

/**
 * Structured message variant.
 *
 * Used for messages rendered as:
 * - a title
 * - a secondary block via `description`
 *
 * `content` is explicitly forbidden to keep the two message shapes exclusive.
 */
export type CoreFullMessage<Name extends string> = CoreBaseMessage<Name> & {
	title: string;
	description: string;
	content?: never;
}

/**
 * Flat message variant.
 *
 * Used for single-line or direct-content messages.
 * `title` and `description` are explicitly forbidden to keep the union strict.
 */
export type CoreNormalMessage<Name extends string> = CoreBaseMessage<Name> & {
	content: string;
	title?: never;
	description?: never;
}

/**
 * Runtime message union supported by the i18n layer.
 *
 * The core accepts exactly two message forms:
 * - `content`
 * - `title` + `description`
 */
export type CoreMessage<Name extends string> = CoreNormalMessage<Name> | CoreFullMessage<Name>;

/**
 * Translation dictionary for a single language.
 *
 * The key is the ergonomic dictionary key used in source files,
 * while `message.code` remains the canonical runtime lookup value.
 */
export type CoreMessagesShape = Record<string, CoreMessage<string>>;

/**
 * Full translations registry keyed by language.
 */
export type CoreTranslationsShape = Record<string, CoreMessagesShape>

/**
 * Dual translation index built during i18n initialization.
 *
 * - `byLang` is optimized for runtime lookup in the active language
 * - `byName` is optimized for reverse access by canonical message code
 */
export type CoreTranslationsIndex = {
	byLang: Record<string, Record<string, CoreMessage<string>>>;
	byName: Record<string, Record<string, CoreMessage<string>>>;
	byKey: Record<string, Record<string, CoreMessage<string>>>;
}

/**
 * Declarative i18n container used by the I18nManager.
 *
 * It stores:
 * - merged translations (builtins + customs)
 * - derived runtime indexes
 */
export type CoreTranslationsDecl<TTranslations extends CoreTranslationsShape> = {
	translations: FinalTranslations<TTranslations>;
	index: CoreTranslationsIndex;
}

/**
 * Final resolved i18n facts exposed at runtime.
 *
 * - `lang` is the active language selected for execution
 * - `fallback` is the fallback language used for missing messages
 * - `index` is the active-language message index by code
 * - `fallbackIndex` is the fallback-language message index by code
 */
export type RuntimeI18nFacts = {
	lang: string
}
