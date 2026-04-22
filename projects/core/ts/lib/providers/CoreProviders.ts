import { IdProvider } from "@providers/id";
import { FsProvider } from "@providers/fs";
import { DatetimeProvider } from "@providers/datetime";
import { ProcessProvider } from "./process";

/**
 * CoreProviders
 *
 * Central interface aggregating all low-level providers used by the core.
 *
 * Purpose:
 * - Abstract access to system-level and utility operations
 * - Decouple core logic from platform-specific implementations
 * - Provide a unified and injectable provider layer through CoreContext
 *
 * Providers overview:
 *
 * - id:
 *   Unique identifier generation
 *   (e.g. ULID or equivalent deterministic ID system)
 *
 * - fs:
 *   Filesystem abstraction layer
 *   (read/write, existence checks, future cross-platform normalization)
 *
 * - datetime:
 *   Date and time utilities
 *   (timestamps, formatting, future deterministic time control)
 *
 * - process:
 *   Process-related utilities
 *   (environment variables, runtime metadata, execution context)
 *
 * Design principles:
 * - No direct access to Node.js APIs inside core logic
 * - All external interactions go through providers
 * - Providers can be swapped, mocked, or extended
 * - Enables cross-platform compatibility and future sandboxing
 *
 * Usage:
 * - Injected into Context
 * - Accessed via ctx.providers.*
 *
 * @interface CoreProviders
 */
export interface CoreProviders {
	id: IdProvider;
	fs: FsProvider;
	datetime: DatetimeProvider;
	process: ProcessProvider;
}
