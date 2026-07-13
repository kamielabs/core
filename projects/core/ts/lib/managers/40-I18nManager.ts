import { I18nManagerContext } from "@contexts";
import { BUILTIN_MESSAGES, FinalTranslations } from "@data";
import { CoreEventKind, CoreEventsChannelsShape, CoreEventsShape, CoreGlobalsShape, CoreMessage, CoreModulesShape, CoreStagesShape, CoreTranslationsDecl, CoreTranslationsShape, RuntimeAppShape, RuntimeI18nFacts } from "@types";

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
	TChannels extends CoreEventsChannelsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TApp extends RuntimeAppShape
> {

	private _ctx: I18nManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>;
	private _dict: CoreTranslationsDecl<TTranslations>;
	private _resolved?: RuntimeI18nFacts;


	/**
	 * Constructor.
	 *
	 * Initializes translation dictionary storage and builds all runtime lookup indexes.
	 *
	 * @param ctx - Global execution context
	 * @param translationsDict - Final normalized translations dictionary
	 */
	private constructor(
		ctx: I18nManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		translations: FinalTranslations<TTranslations>
	) {
		this._ctx = ctx;
		this._dict = {
			translations,
			index: {
				byKey: {},
				byName: {},
				byLang: {}
			}
		};
	}

	public static create<
		TEvents extends CoreEventsShape,
		TChannels extends CoreEventsChannelsShape,
		TStages extends CoreStagesShape,
		TGlobals extends CoreGlobalsShape,
		TModules extends CoreModulesShape,
		TTranslations extends CoreTranslationsShape,
		TApp extends RuntimeAppShape
	>(
		ctx: I18nManagerContext<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp>,
		translations: FinalTranslations<TTranslations>
	): I18nManager<TEvents, TChannels, TStages, TGlobals, TModules, TTranslations, TApp> {
		return new I18nManager(ctx, translations);
	}

	public init: () => Promise<void> = async (): Promise<void> => {
		await this._resolveIndexes();
		this._freezeDict();
	};

	private _freezeDict() {
		this._dict = this._ctx.helpers.core.deepFreeze(this._dict);
	}


	private _setResolved(state: RuntimeI18nFacts): void | never {
		if (this._resolved) {
			this._ctx.events.throw('i18nAlreadyResolved');
		}
		this._resolved = this._ctx.helpers.core.deepClone(state);
		this._resolved = this._ctx.helpers.core.deepFreeze(this._resolved);
	}

	public getDict(): CoreTranslationsDecl<TTranslations> {
		return this._dict;
	}

	/**
	 * Returns resolved state.
	 *
	 */
	public getResolved(): RuntimeI18nFacts {
		if (!this._resolved) {
			this._ctx.events.throw('i18nMissingResolved');
		}
		return this._resolved;
	}

	/**
	 * Indicates if state is resolved.
	 */
	public isResolved(): boolean {
		return !!this._resolved;
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
	private async _resolveIndexes() {
		const dict = this.getDict().translations;

		const byKey: Record<string, Record<string, CoreMessage<string>>> = {};
		const byLang: Record<string, Record<string, CoreMessage<string>>> = {};
		const byName: Record<string, Record<string, CoreMessage<string>>> = {};

		for (const lang of Object.keys(dict)) {
			const langDict = dict[lang];
			if (!langDict) continue;

			byLang[lang] = {};

			for (const key of Object.keys(langDict)) {
				const msg = langDict[key];
				if (!msg) continue;
				const name = msg.name;

				// byLang
				byLang[lang][name] = msg;

				// byName
				if (!byName[name]) {
					byName[name] = {};
				}

				byName[name][lang] = msg;
				// byKey
				if (!byKey[key]) {
					byKey[key] = {};
				}

				byKey[key][lang] = msg;
			}
		}

		this.getDict().index = { byKey, byLang, byName };
	}

	/**
	 * Resolve runtime i18n facts.
	 *
	 * Resolution flow:
	 * 1. Resolve active language from stage facts
	 * 2. Enforce "en" as mandatory fallback dictionary
	 * 3. Validate non-reference languages against "en"
	 * 4. Build immutable RuntimeI18nFacts
	 * 5. Freeze dictionary and mark resolver as ready
	 *
	 * Validation semantics:
	 * - Missing keys in non-"en" languages emit i18nMissingKeys
	 * - Unknown keys not present in "en" emit i18nUnknownKeys and stop resolution
	 * - Missing "en" dictionary emits i18nMissingLang and aborts resolution
	 *
	 * Fallback semantics:
	 * - Active language may be partial
	 * - Missing translations are expected to fall back to "en" at lookup time
	 *
	 * @returns Promise<void>
	 */
	public async resolve(): Promise<void> {

		const fallback = "en";

		const stage = this._ctx.stages.getResolved();

		const lang = stage.options.lang as string ?? fallback;

		const dict = this.getDict().index.byLang;

		/**
		 * Builtin english dictionary is mandatory.
		 */
		const en = dict[fallback];

		if (!en) {
			this._ctx.events.throw("i18nMissingLang", {
				details: ["'en' builtins mandatory"]
			});
		}

		/**
		 * Resolve builtin runtime message names from event registry.
		 *
		 * Rules:
		 * - only builtin CORE_* message events are considered
		 * - english translations are the mandatory reference layer
		 */
		const builtinNames = Object
			.values(this._ctx.events.getEvents())
			.filter(
				(event) =>
					event.kind === CoreEventKind.message &&
					event.name.startsWith("CORE_")
			)
			.map((event) => event.name);

		/**
		 * Validate english builtin completeness.
		 *
		 * Every builtin message event MUST exist in english.
		 */
		const missingBuiltinEn = builtinNames.filter(
			(name) => !(name in en)
		);

		if (missingBuiltinEn.length > 0) {
			this._ctx.events.throw("i18nMissingBuiltinMessage", {
				details: missingBuiltinEn
			});
		}

		/**
		 * Validate non-reference languages.
		 */
		for (const currentLang of Object.keys(dict)) {

			if (!(currentLang in BUILTIN_MESSAGES)) continue;

			if (currentLang === fallback) continue;

			const current = dict[currentLang];

			if (!current) continue;

			/**
			 * Missing builtin messages in non-reference languages.
			 *
			 * Allowed:
			 * - runtime fallback to "en" will handle resolution
			 */
			const missing = builtinNames.filter(
				(name) => !(name in current)
			);

			if (missing.length > 0) {
				await this._ctx.events.warn("i18nMissingKeys", {
					details: [
						`lang:${currentLang}`,
						`missing:${missing.length}`,
						...missing
					]
				});
			}

			/**
			 * Detect unknown builtin names.
			 *
			 * If a language declares a CORE_* message that does not exist
			 * in english builtins, resolution MUST stop.
			 */
			const unknownNames: string[] = Object.keys(current).filter(
				(name) =>
					name.startsWith("CORE_") &&
					!(name in en)
			);

			if (unknownNames.length > 0) {
				this._ctx.events.throw("i18nUnknownKeys", {
					details: [
						`lang:${currentLang}`,
						`count:${unknownNames.length}`,
						...unknownNames
					]
				});
			}
		}

		/**
		 * Freeze dictionaries after validation.
		 */
		this._freezeDict();

		/**
		 * Runtime facts are intentionally minimal.
		 *
		 * Translation indexes remain internal to I18nManager.
		 */
		const resolved: RuntimeI18nFacts = {
			lang
		};

		this._setResolved(resolved);
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
	 * - it never fails
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

		return text.replace(/\{(.*?)\}/g, (_match, key) => {

			if (key in values) {
				return values[key]!;
			}

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
	 * - If called before resolution, `getResolved()` emits `i18nMissingResolved`
	 *
	 * @param name - Canonical translation name
	 * @param values - Optional placeholder values
	 * @returns Resolved CoreMessage
	 */
	public async tr(
		name: string,
		values?: Record<string, string>
	): Promise<CoreMessage<string>> {

		const lang = this.getResolved().lang;

		const indexes = this.getDict().index;

		const byName = indexes.byName;

		const isBuiltin = name.startsWith("CORE_");

		/**
		 * Resolve message bucket by canonical runtime name.
		 */
		const bucket = byName[name];

		/**
		 * Builtin messages:
		 * - fallback to "en"
		 * - strict runtime guarantees
		 */
		if (isBuiltin) {

			const msg =
				bucket?.[lang] ??
				bucket?.["en"];

			/**
			 * Builtin fallback used. No warning for builtins eventually , commenting this part
			 */
			// if (!bucket?.[lang] && bucket?.["en"]) {
			// 	await this._ctx.events.warn("i18nFallbackUsed", {
			// 		details: [name]
			// 	});
			// }

			/**
			 * Impossible runtime state.
			 *
			 * Builtins are validated during resolve().
			 */
			if (!msg) {
				this._ctx.events.throw("i18nMissingBuiltinMessage", {
					details: [name]
				});
			}

			// normal message
			if ("content" in msg) {
				return {
					name,
					content: this._inject(msg.content, values)
				};
			}

			// full message
			return {
				name,
				title: this._inject(msg.title, values),
				description: this._inject(msg.description, values)
			};
		}

		/**
		 * Custom messages:
		 * - no language fallback
		 * - fallback directly to runtime name
		 */
		const msg = bucket?.[lang];
		if (!msg) {

			if (!this._ctx.settings.skipI18nWarnings) {
				await this._ctx.events.warn("i18nFallbackUsed", {
					details: [name]
				});
			}

			return {
				name,
				content: name
			};
		}

		// normal message
		if ("content" in msg) {
			return {
				name,
				content: this._inject(msg.content, values)
			};
		}

		// full message
		return {
			name,
			title: this._inject(msg.title, values),
			description: this._inject(msg.description, values)
		};
	}
};
