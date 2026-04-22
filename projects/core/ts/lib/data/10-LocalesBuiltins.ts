import { CoreTranslationsShape } from "@types";
import {
    BUILTIN_EN_MESSAGES,
    BUILTIN_FR_MESSAGES
} from "@locales";

export const BUILTIN_MESSAGES = {
    en: BUILTIN_EN_MESSAGES,
    fr: BUILTIN_FR_MESSAGES
} satisfies CoreTranslationsShape;

export type BuiltinMessages = typeof BUILTIN_MESSAGES;
export type FinalTranslations<TTranslations extends CoreTranslationsShape> = BuiltinMessages & TTranslations;