/**
 * FsProvider
 *
 * Abstraction layer for filesystem operations.
 *
 * Purpose:
 * - Provide a minimal, controlled interface for file system access
 * - Decouple core logic from native Node.js fs module
 * - Enable cross-platform compatibility and future sandboxing
 *
 * Responsibilities:
 * - Check file existence
 * - Read text file content
 *
 * Design principles:
 * - Minimal surface (only required operations exposed)
 * - Synchronous API (deterministic, simple core usage)
 * - Replaceable implementation (Node, mock, virtual FS, etc.)
 *
 * Usage:
 * - Injected via CoreProviders
 * - Accessed through ctx.providers.fs
 *
 * @interface FsProvider
 */
export interface FsProvider {

	/**
	 * Check if a file exists at the given path.
	 *
	 * @param path - Absolute or relative file path
	 * @returns boolean - True if file exists, false otherwise
	 */
	fileExist(path: string): boolean;

	/**
	 * Read a file as UTF-8 text.
	 *
	 * @param path - Absolute or relative file path
	 * @returns string - File content
	 */
	readTextFile(path: string): string;
}
