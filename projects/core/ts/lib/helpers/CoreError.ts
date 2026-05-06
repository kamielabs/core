// NOTE:
// - CoreError is used for early-phase errors (before EventsManager is available)
// - It provides a minimal, synchronous error handling mechanism

import { CoreErrorsShape } from "@types";

// WARNING:
// - Should ONLY be used during initialization / pre-runtime phases
// - Once EventsManager is available, prefer event-based error handling
// - panic() will terminate the process immediately

/**
 * CoreError
 *
 * Specialized core error class used before the event system becomes available.
 *
 * Current scope:
 * - bootstrap / pre-init failures
 * - builder-time validation failures
 * - a few transitional structural/runtime cases that are expected to become
 *   regular core events later
 *
 * Design intent:
 * - keep early failures synchronous and deterministic
 * - avoid leaking raw Node.js stack traces in normal CLI output
 * - provide a normalized error shape until EventsManager is ready
 */
export class CoreError extends Error {

	private static _coreErrors = {
		instanceDuplicated: {
			name: 'CORE_CLI_DUPLICATE_INSTANCE',
			code: 'F00001',
			source: 'CLI.init'
		},
		eventNamespace: {
			name: 'CORE_EVENTS_RESERVED_NAMESPACE',
			code: 'F00100',
			source: 'Builders.buildEvents'
		},
		eventInvalidKey: {
			name: 'CORE_EVENTS_INVALID_KEY',
			code: 'F00101',
			source: 'Builders.buildEvents'
		},
		eventDuplicatedKey: {
			name: 'CORE_EVENTS_DUPLICATE_KEY',
			code: 'F00102',
			source: 'Builders.buildEvents'
		},
		eventDuplicatedName: {
			name: 'CORE_EVENTS_DUPLICATE_NAME',
			code: 'F00103',
			source: 'Builders.buildEvents'
		},
		stageFileDuplicated: {
			name: 'CORE_STAGE_FILE_DUPLICATE',
			code: 'F00300',
			source: 'Builders.buildStages'
		},
		stagePropDuplicated: {
			name: 'CORE_STAGE_PROP_DUPLICATE',
			code: 'F00301',
			source: 'Builders.buildStages'
		},
		stageFileMissing: {
			name: 'CORE_STAGE_FILE_MISSING',
			code: 'F00302',
			source: 'Builders.buildStages'
		},
		stageLangMissing: {
			name: 'CORE_STAGE_LANG_MISSING',
			code: 'F00303',
			source: 'Builders.buildStages'
		},
		i18nNameSpace: {
			name: 'CORE_I18N_RESERVED_NAMESPACE',
			code: 'F00400',
			source: 'Builders.buildTranslations'
		},
		i18nMessageDuplicated: {
			name: 'CORE_I18N_DUPLICATE_MESSAGE',
			code: 'F00401',
			source: 'Builders.buildTranslations'
		},
		i18nInvalidKey: {
			name: 'CORE_I18N_INVALID_KEY',
			code: 'F00402',
			source: 'Builders.buildTranslations'
		},
		globalsNamespace: {
			name: 'CORE_GLOBALS_RESERVED_NAMESPACE',
			code: 'F00500',
			source: 'Builders.buildEvents'
		},
		modulesNamespace: {
			name: 'CORE_MODULES_RESERVED_NAMESPACE',
			code: 'F00700',
			source: 'Builders.buildEvents'
		},
		unknownError: {
			name: 'CORE_UNKNOWN_ERROR',
			code: 'F99999',
			source: 'unknown'
		}
	} satisfies CoreErrorsShape;

	public readonly nameCode: string;
	public readonly code: string;
	public readonly source: string;

	/**
	 * Create a normalized early-phase core error instance.
	 *
	 * Unknown keys fall back to `unknownError` so callers always receive a
	 * consistent error shape.
	 *
	 * @param key - Internal CoreError registry key
	 * @param desc - Optional human-readable override
	 */
	constructor(
		public readonly key: keyof typeof CoreError._coreErrors,
		public readonly desc?: string
	) {
		// fallback sécurisé vers unknownError
		const error = CoreError._coreErrors[key] ?? CoreError._coreErrors.unknownError;

		const message = desc ?? error.name;

		super(message);

		this.name = 'CoreError';
		this.nameCode = error.name;
		this.code = error.code;
		this.source = error.source;
	}

	/**
	 * panic
	 *
	 * Fatal error handler used by the root `try/catch` normalization path when
	 * the system cannot recover or when raw thrown errors must be rendered
	 * cleanly instead of exposing noisy Node.js stack traces.
	 *
	 * @param key - CoreError key
	 * @param desc - Optional override message
	 */
	public static panic(
		key: keyof typeof CoreError._coreErrors,
		desc?: string
	): never {

		const error = CoreError._coreErrors[key];

		if (!error) {
			console.error(`[CORE: UNKNOWN] Unknown CoreError key: ${String(key)}`);
			process.exit(1);
		}

		const message = desc ?? error.name;

		console.error(
			`[CORE: ${error.code}] ${error.name}\n`,
			`Source: ${error.source}\n`,
			`Error: ${message}`
		);

		process.stderr.write("");

		process.exit(1);
	}

	/**
	 * Return a raw registered CoreError definition.
	 */
	public static get(key: keyof typeof CoreError._coreErrors) {
		return CoreError._coreErrors[key];
	}
}
