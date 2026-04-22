// NOTE:
// - CoreError is used for early-phase errors (before EventsManager is available)
// - It provides a minimal, synchronous error handling mechanism

// WARNING:
// - Should ONLY be used during initialization / pre-runtime phases
// - Once EventsManager is available, prefer event-based error handling
// - panic() will terminate the process immediately

export class CoreError extends Error {

	/**
	 * CoreError
	 *
	 * Custom error class used by the core.
	 *
	 * Purpose:
	 * - Represent structured internal errors
	 * - Provide consistent error typing (type, source, description)
	 *
	 * Typically used during:
	 * - initialization
	 * - builder validation
	 * - early manager setup
	 *
	 * @param type - Error type identifier (machine-readable)
	 * @param source - Origin of the error (class/method)
	 * @param desc - Human-readable error description
	 */
	constructor(
		public readonly type: string,
		public readonly source: string,
		public readonly desc: string
	) {
		super(desc);
		this.name = "CoreError";
	}

	/**
	 * panic
	 *
	 * Fatal error handler used when the system cannot recover.
	 *
	 * Behavior:
	 * - Logs error to stderr
	 * - Forces log flush
	 * - Terminates process with exit code 1
	 *
	 * Usage:
	 * - Before EventsManager is initialized
	 * - When no structured error handling is available
	 *
	 * WARNING:
	 * - This method NEVER returns
	 * - Should be used sparingly
	 *
	 * @param type - Error type identifier
	 * @param source - Origin of the error
	 * @param desc - Error description
	 *
	 * @returns never
	 */
	public static panic(
		type: string,
		source: string,
		desc: string
	): never {

		console.error(
			`[CORE: ${type}]\n`,
			`Source: ${source}\n`,
			`Error: ${desc}`
		);

		// flush logs (important en node)
		process.stderr.write("");

		process.exit(1);
	}
}
