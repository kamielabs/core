/**
 * DatetimeProvider
 *
 * Abstraction layer for time-related operations.
 *
 * Purpose:
 * - Provide a consistent interface for retrieving and formatting time
 * - Decouple core logic from native Date APIs
 * - Enable deterministic behavior (e.g. testing, mocking, replay systems)
 *
 * Responsibilities:
 * - Return current timestamp
 * - Format timestamps into human-readable strings
 *
 * Design principles:
 * - Pure interface (no implementation details)
 * - Platform-agnostic contract
 * - Replaceable provider (Node, browser, mock, etc.)
 *
 * Usage:
 * - Injected via CoreProviders
 * - Accessed through ctx.providers.datetime
 *
 * @interface DatetimeProvider
 */
export interface DatetimeProvider {
	/**
	 * Get current timestamp.
	 *
	 * @returns number - Current time in milliseconds since epoch
	 */
	now(): number;

	/**
	 * Format a timestamp into a string representation.
	 *
	 * @param timestamp - Time in milliseconds since epoch
	 * @returns string - Formatted time string
	 */
	format(timestamp: number): string;
}
