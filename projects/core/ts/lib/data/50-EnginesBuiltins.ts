import { FedEngine, StandardEngine } from "@engines";

/**
 * Builtin engine registry exposed to `CoreEngine`.
 *
 * Current scope:
 * - `std` → procedural builtin engine
 * - `fed` → full event-driven builtin engine
 *
 * This registry is intentionally minimal for now and is expected to evolve
 * together with the future `EngineManager` / custom-engine support.
 */
export const BUILTIN_ENGINES = {
	std: StandardEngine,
	fed: FedEngine
} as const;

/**
 * Canonical builtin engine selector keys.
 */
export type CoreEngineName = keyof typeof BUILTIN_ENGINES;
// "std" | "fed"
