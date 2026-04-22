/**
 * IdProvider
 *
 * Abstraction layer for unique identifier generation.
 *
 * Purpose:
 * - Provide a consistent interface for generating unique IDs
 * - Decouple core logic from specific ID generation libraries
 * - Allow interchangeable implementations (ULID, UUID, custom, etc.)
 *
 * Responsibilities:
 * - Generate unique identifiers as strings
 *
 * Design principles:
 * - Minimal interface (single responsibility)
 * - Deterministic contract (always returns string)
 * - Replaceable implementation for different environments or strategies
 *
 * Usage:
 * - Injected via CoreProviders
 * - Accessed through ctx.providers.id
 *
 * @interface IdProvider
 */
export interface IdProvider {

	/**
	 * Generate a unique identifier.
	 *
	 * @returns string - Unique ID
	 */
	create(): string
}
