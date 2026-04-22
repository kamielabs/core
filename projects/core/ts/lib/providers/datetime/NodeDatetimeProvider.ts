import { DatetimeProvider } from "./DatetimeProvider";

// FIX: Date showed in UTC, we should use system timezone ( and we have all env vars i bootstrap )

/**
 * NodeDatetimeProvider
 *
 * Default Node.js implementation of DatetimeProvider.
 *
 * Implementation details:
 * - Uses native Date API
 * - Provides ISO-based formatting
 *
 * Behavior:
 * - now(): returns Date.now()
 * - format():
 *   - Converts timestamp to ISO string
 *   - Extracts time portion (HH:mm:ss.sss)
 *   - Removes trailing "Z"
 *
 * Example output:
 * - "14:32:10.123"
 *
 * Design considerations:
 * - Lightweight and deterministic
 * - Suitable for logging and event timestamps
 * - Can be replaced by custom providers if needed
 *
 * @class NodeDatetimeProvider
 * @implements DatetimeProvider
 */
export class NodeDatetimeProvider implements DatetimeProvider {

	/**
	 * Get current timestamp using Node.js Date API.
	 *
	 * @returns number - Current time in milliseconds
	 */
	now() {
		return Date.now();
	}

	/**
	 * Format a timestamp into a time string.
	 *
	 * Format:
	 * - ISO string → extract time portion → remove "Z"
	 *
	 * @param timestamp - Time in milliseconds
	 * @returns string - Formatted time (HH:mm:ss.sss)
	 */
	format(timestamp: number): string {
		const d = new Date(timestamp);
		return d.toISOString().split("T")[1]!.replace("Z", "");
	}
}
