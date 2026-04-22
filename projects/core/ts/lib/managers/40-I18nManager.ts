import { ResolverManagerWithDict } from "@abstracts";
import { Context } from "@contexts";
import { FinalTranslations } from "@data";
import { CoreEventsShape, CoreGlobalsShape, CoreMessage, CoreModulesShape, CoreStagesShape, CoreTranslationsDecl, CoreTranslationsShape, RuntimeI18nFacts } from "@types";

/**
 * TODO: V0.1: Polish the entire class: remove the builtins hook methods for old builtin stages and their caller method
 *
 * TODO: V0.1: Review the full class and deps for validating v0.1 (nothing to do if am not wrong, this class is already pixel perfect like we want)
 */

/**
 * I18nManager
 *
 * Central resolver responsible for translation indexing and runtime i18n facts.
 *
 * Responsibilities:
 * - Index all translations by language and by message code
 * - Resolve active runtime language from stage facts
 * - Enforce English ("en") as the mandatory fallback reference
 * - Detect missing and unknown keys in non-reference languages
 * - Provide runtime translation lookup with fallback behavior
 * - Inject dynamic values into translated messages
 *
 * Fallback model:
 * - "en" is the reference language
 * - Requested language is resolved from runtime stage option `lang`
 * - If a message is missing in the requested language, fallback is attempted on "en"
 * - If the message does not exist in "en" either, a synthetic fallback message is returned using the code itself
 *
 * Validation model:
 * - Missing keys in non-reference languages do NOT fail resolution
 * - Unknown keys present in non-reference languages but absent from "en" are reported
 * - Missing "en" dictionary is fatal because it is the canonical fallback source
 *
 * Design principles:
 * - English is the source of truth at runtime
 * - Non-English languages may be partial
 * - Resolution is deterministic and read-only after freeze
 * - Translation lookup must remain safe even with incomplete dictionaries
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class I18nManager<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> extends ResolverManagerWithDict<
	CoreTranslationsDecl<FinalTranslations<TTranslations>>,
	RuntimeI18nFacts,
	TEvents, TStages, TGlobals, TModules, TTranslations
> {

	/**
	 * Constructor.
	 *
	 * Initializes translation dictionary storage and builds all runtime lookup indexes.
	 *
	 * @param ctx - Global execution context
	 * @param translationsDict - Final normalized translations dictionary
	 */
	constructor(
		protected readonly ctx: Context<TEvents, TStages, TGlobals, TModules, TTranslations>,
		translationsDict: FinalTranslations<TTranslations>
	) {
		super(ctx, {
			translations: translationsDict,
			index: {
				byCode: {},
				byLang: {}
			}
		});
		this._resolveIndexes();
	}

	/**
	 * Build internal translation indexes.
	 *
	 * Creates:
	 * - byLang: language → code → message
	 * - byCode: code → language → message
	 *
	 * This dual indexing supports:
	 * - fast runtime lookup by active language
	 * - reverse inspection by message code across languages
	 *
	 * Indexing rules:
	 * - only defined messages are indexed
	 * - message.code is treated as the canonical runtime lookup key
	 */
	private _resolveIndexes() {
		const dict = this.getDict().translations;

		const byLang: Record<string, Record<string, CoreMessage<string>>> = {};
		const byCode: Record<string, Record<string, CoreMessage<string>>> = {};

		for (const lang of Object.keys(dict)) {
			const langDict = dict[lang];
			if (!langDict) continue;

			byLang[lang] = {};

			for (const key of Object.keys(langDict)) {
				const msg = langDict[key];
				if (!msg) continue;
				const code = msg.code;

				// byLang
				byLang[lang][code] = msg;

				// byCode
				if (!byCode[code]) {
					byCode[code] = {};
				}

				byCode[code][lang] = msg;
			}
		}

		this.getDict().index = { byLang, byCode };
	}

	/**
	 * Resolve runtime i18n facts.
	 *
	 * Resolution flow:
	 * 1. Emit i18nInit
	 * 2. Resolve active language from stage facts
	 * 3. Enforce "en" as mandatory fallback dictionary
	 * 4. Validate non-reference languages against "en"
	 * 5. Build immutable RuntimeI18nFacts
	 * 6. Freeze dictionary and mark resolver as ready
	 * 7. Emit i18nReady
	 *
	 * Validation semantics:
	 * - Missing keys in non-"en" languages emit i18nMissingKeys
	 * - Unknown keys not present in "en" emit i18nUnknownKeys
	 * - Missing "en" dictionary emits i18nFatal and aborts resolution
	 *
	 * Fallback semantics:
	 * - Active language may be partial
	 * - Missing translations are expected to fall back to "en" at lookup time
	 *
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		await this.ctx.events.internalEmit("i18nInit");

		const fallback = "en";
		const lang = this.ctx.stages.getResolved().options.lang as string ?? fallback;

		const dict = this.getDict().index.byLang;

		const en = dict[fallback];
		if (!en) {
			await this.ctx.events.internalEmit("i18nFatal");
			return;
		}

		for (const langDict of Object.keys(dict)) {
			if (langDict === fallback) continue;

			const current = dict[langDict]!;

			const missing = Object.keys(en).filter(k => !(k in current));
			if (missing.length) {
				await this.ctx.events.internalEmit("i18nMissingKeys", {
					details: [`lang:${langDict}`, `missing:${missing.length}`, ...missing]
				});
			}

			const unknown = Object.keys(current).filter(k => !(k in en));
			if (unknown.length) {
				await this.ctx.events.internalEmit("i18nUnknownKeys", {
					details: [`lang:${langDict}`, `count:${unknown.length}`, ...unknown]
				});
			}
		}

		const index = dict[lang] ?? {};
		const fallbackIndex = dict[fallback]!;

		const resolved: RuntimeI18nFacts = {
			lang,
			fallback,
			index,
			fallbackIndex

		}

		this.freezeDict();
		this.setResolved(resolved);

		await this.ctx.events.internalEmit("i18nReady");
	}

	/**
	 * Inject dynamic placeholder values into a translated string.
	 *
	 * Placeholder format:
	 * - `{key}`
	 *
	 * Behavior:
	 * - If `values` is not provided, text is returned unchanged
	 * - If a placeholder key exists in `values`, it is replaced
	 * - If a placeholder key is missing, i18nMissingMessageValues is emitted
	 *   and the original placeholder is preserved
	 *
	 * This method is intentionally tolerant:
	 * - it never throws
	 * - it preserves unresolved placeholders for visibility/debugging
	 *
	 * @param text - Raw translated text
	 * @param values - Optional placeholder values
	 * @returns Injected text
	 */
	private _inject(
		text: string,
		values?: Record<string, string>
	): string {
		if (!values) return text;

		return text.replace(/\{(.*?)\}/g, (_match: string, key: string) => {
			if (values && key in values) {
				return values[key]!;
			}

			this.ctx.events.internalEmit("i18nMissingMessageValues", {
				details: [key]
			});

			return `{${key}}`;
		});
	}

	/**
	 * Translate a message code into a runtime message object.
	 *
	 * Lookup order:
	 * 1. Active language index
	 * 2. English fallback index
	 * 3. Synthetic fallback message using the code
	 *
	 * Fallback behavior:
	 * - If active language does not contain the code, fallback to "en"
	 * - If fallback is used successfully, i18nFallbackUsed is emitted
	 * - If no translation exists at all, i18nMissingMessage is emitted and a synthetic
	 *   message is returned with content `MISSING 'EN' MESSAGE: ${code}`
	 *
	 * Message shapes:
	 * - Simple message: `{ code, content }`
	 * - Full message: `{ code, title, description }`
	 *
	 * Placeholder injection:
	 * - Applies to `content`, `title`, and `description`
	 * - Uses `_inject()` for safe runtime substitution
	 *
	 * Guard behavior:
	 * - If called before resolution, i18nFatal is emitted
	 *
	 * @param code - Canonical translation code
	 * @param values - Optional placeholder values
	 * @returns Resolved CoreMessage
	 */
	public async tr(
		code: string,
		values?: Record<string, string>
	): Promise<CoreMessage<string>> {

		// guard
		if (!this.isResolved()) {
			await this.ctx.events.internalEmit("i18nFatal");
		}

		const { index, fallbackIndex } = this.getResolved();

		let msg = index[code];

		// fallback
		if (!msg) {
			msg = fallbackIndex[code];

			if (msg) {
				await this.ctx.events.internalEmit("i18nFallbackUsed", {
					details: [code]
				});
			}
		}

		// missing message
		if (!msg) {
			await this.ctx.events.internalEmit("i18nMissingMessage", {
				details: [code]
			});

			return {
				code,
				content: `MISSING 'EN' MESSAGE: ${code}`
			};
		}

		// normal message
		if ("content" in msg) {
			return {
				code,
				content: this._inject(msg.content, values)
			};
		}

		// full message
		return {
			code,
			title: this._inject(msg.title, values),
			description: this._inject(msg.description, values)
		};
	}
};
