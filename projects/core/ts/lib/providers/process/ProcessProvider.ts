/**
 * TODO: V0.2: Extend ProcessProvider to expose process.env and process.argv through provider abstraction
 *
 * NOTE: "which" is currently not used in core logic but kept for compatibility and future use
 */

/**
 * ProcessProvider
 *
 * Abstraction layer for process-level operations.
 *
 * Purpose:
 * - Provide controlled access to system process utilities
 * - Decouple core logic from direct Node.js process APIs
 * - Prepare future extension for environment and argument handling
 *
 * Current responsibilities:
 * - Locate executable binaries in system PATH (which)
 *
 * Future responsibilities (V0.2+):
 * - Provide access to process.env
 * - Provide access to process.argv
 * - Centralize runtime environment handling in a provider layer
 *
 * Design principles:
 * - Minimal interface (incremental extension)
 * - Replaceable implementation (Node, sandbox, custom runtime)
 * - Avoid direct process access in core logic
 *
 * Usage:
 * - Injected via CoreProviders
 * - Accessed through ctx.providers.process
 *
 * @interface ProcessProvider
 */
export interface ProcessProvider {

	/**
	 * Locate a command in the system PATH.
	 *
	 * Behavior:
	 * - Returns absolute path if found
	 * - Returns null if not found
	 *
	 * @param cmd - Command name
	 * @returns string | null
	 */
	which(cmd: string): string | null;
}
