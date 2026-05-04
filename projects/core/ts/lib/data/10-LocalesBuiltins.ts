import { CoreTranslationsShape } from "@types";
import {
    BUILTIN_EN_MESSAGES,
    BUILTIN_FR_MESSAGES
} from "@locales";

/**
 * Final builtin translations dictionary exposed to the core.
 *
 * This object concatenates the builtin locale slices into the base
 * translation registry consumed by `I18nManager`.
 */
export const BUILTIN_MESSAGES = {
    en: BUILTIN_EN_MESSAGES,
    fr: BUILTIN_FR_MESSAGES
} satisfies CoreTranslationsShape;

/**
 * Concrete builtin translation dictionary type inferred from `BUILTIN_MESSAGES`.
 */
export type BuiltinMessages = typeof BUILTIN_MESSAGES;

/**
 * Final translation dictionary shape once builtin and custom locales are merged.
 */
export type FinalTranslations<TTranslations extends CoreTranslationsShape> = BuiltinMessages & TTranslations;
