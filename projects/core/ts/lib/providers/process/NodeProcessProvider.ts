import { ProcessProvider } from "@providers/process";
import { spawnSync } from "node:child_process";

/**
 * NodeProcessProvider
 *
 * Node.js implementation of ProcessProvider.
 *
 * Implementation details:
 * - Uses `spawnSync` to execute the `which` command
 *
 * Behavior:
 * - which():
 *   - Executes `which <cmd>` in a child process
 *   - Returns resolved path if command exists
 *   - Returns null if command is not found
 *
 * Notes:
 * - This implementation depends on the presence of `which` in the system
 * - Not cross-platform (Windows compatibility requires adaptation)
 * - Currently not used in core runtime flow
 *
 * Design considerations:
 * - Kept for compatibility and potential future use
 * - Will likely evolve in V0.2 to include process.env and process.argv access
 *
 * @class NodeProcessProvider
 * @implements ProcessProvider
 */
export class NodeProcessProvider implements ProcessProvider {

	/**
	 * Locate a command using system "which".
	 *
	 * @param cmd - Command name
	 * @returns string | null - Resolved path or null if not found
	 */
	which(cmd: string): string | null {
		const res = spawnSync("which", [cmd], { encoding: "utf8" });
		return res.status === 0 ? res.stdout.trim() : null;
	}
}
