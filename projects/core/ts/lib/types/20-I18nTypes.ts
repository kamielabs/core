export type CoreBaseMessage<Code extends string> = {
    code: Code;
}

export type CoreFullMessage<Code extends string> = CoreBaseMessage<Code> & {
    title: string;
    description: string;
    content?: never;
}

export type CoreNormalMessage<Code extends string> = CoreBaseMessage<Code> & {
    content: string;
    title?: never;
    description?: never;
}

export type CoreMessage<Code extends string> = CoreNormalMessage<Code> | CoreFullMessage<Code>;
export type CoreMessagesShape = Record<string, CoreMessage<string>>;

export type CoreTranslationsShape = Record<string, CoreMessagesShape>

export type CoreTranslationsIndex = {
  byLang: Record<string, Record<string, CoreMessage<string>>>;
  byCode: Record<string, Record<string, CoreMessage<string>>>;
}

export type CoreTranslationsDecl<TTranslations extends CoreTranslationsShape> = {
    translations: TTranslations;
    index: CoreTranslationsIndex;
}

export type RuntimeI18nFacts = {
  lang: string
  fallback: string
  index: Record<string, CoreMessage<string>>;
  fallbackIndex: Record<string, CoreMessage<string>>;
}