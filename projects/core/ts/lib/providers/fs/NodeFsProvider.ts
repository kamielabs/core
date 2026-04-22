import fs from "node:fs";
import { FsProvider } from "@providers/fs";

/**
 * NodeFsProvider
 *
 * Default Node.js implementation of FsProvider.
 *
 * Implementation details:
 * - Uses native fs module (synchronous methods)
 *
 * Behavior:
 * - fileExist():
 *   - Uses fs.existsSync
 * - readTextFile():
 *   - Uses fs.readFileSync with UTF-8 encoding
 *
 * Design considerations:
 * - Synchronous operations preferred for deterministic core behavior
 * - Minimal abstraction layer (no extra logic or normalization)
 * - Intended to be replaced later by a higher-level CoreHelpers abstraction
 *
 * Limitations:
 * - No path normalization (handled elsewhere)
 * - No permission checks
 * - No error wrapping (delegated to higher layers)
 *
 * @class NodeFsProvider
 * @implements FsProvider
 */
export class NodeFsProvider implements FsProvider {

	/**
	 * Check if a file exists using Node.js fs.existsSync.
	 *
	 * @param path - File path
	 * @returns boolean
	 */
	fileExist(path: string): boolean {
		return fs.existsSync(path);
	};

	/**
	 * Read a file as UTF-8 text using Node.js fs.readFileSync.
	 *
	 * @param path - File path
	 * @returns string - File content
	 */
	readTextFile(path: string): string {
		return fs.readFileSync(path, "utf-8");
	}
}
