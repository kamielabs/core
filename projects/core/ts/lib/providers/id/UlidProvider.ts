import { ulid } from "ulid";
import { IdProvider } from "@providers/id";

/**
 * UlidIdProvider
 *
 * Default implementation of IdProvider using ULID.
 *
 * ULID characteristics:
 * - Universally Unique Lexicographically Sortable Identifier
 * - Time-based ordering
 * - URL-safe string format
 * - No external dependencies at runtime
 *
 * Behavior:
 * - create():
 *   - Generates a ULID using the ulid library
 *
 * Design considerations:
 * - Deterministic ordering (useful for logs, events, timelines)
 * - Lightweight and fast
 * - Suitable for distributed systems without coordination
 *
 * @class UlidIdProvider
 * @implements IdProvider
 */
export class UlidIdProvider implements IdProvider {

	/**
	 * Generate a ULID identifier.
	 *
	 * @returns string - ULID string
	 */
	public create(): string {
		return ulid()
	}
}
