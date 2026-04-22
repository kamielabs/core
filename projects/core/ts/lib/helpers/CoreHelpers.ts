// NOTE:
// - CoreHelpers is the central helper utility bound to the Core Context
// - Unlike other helpers, it requires access to providers and runtime state
// - Exposed via ctx.helpers for internal usage across the core

// WARNING:
// - Some methods depend on lifecycle readiness (e.g. events)
// - Must not be used blindly without considering context.ready state

// TODO: ARCHITECTURE — Integrate all helpers into Context (ctx.helpers.*)
// Currently only CoreHelpers is context-bound due to providers dependency

import { Context } from "@contexts";
import { BuiltinEvents } from "@data";
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	EmitOptionsForKey
} from "@types";
import { CoreError } from "@helpers";

/**
 * CoreHelpers
 *
 * Context-bound helper utility class.
 *
 * Responsibilities:
 * - Provide safe wrappers around core operations
 * - Bridge early-phase and runtime behaviors
 * - Expose utility methods requiring providers or context access
 *
 * Design:
 * - Not static (requires Context access)
 * - Used internally by core components
 *
 * @template TEvents
 * @template TStages
 * @template TGlobals
 * @template TModules
 * @template TTranslations
 */
export class CoreHelpers<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> {
	constructor(private ctx: Context<
		TEvents, TStages, TGlobals, TModules, TTranslations
	>) { };

	/**
	 * emitOrThrow
	 *
	 * Safe event emission wrapper.
	 *
	 * Behavior:
	 * - If EventsManager is ready → emit event
	 * - Otherwise → throw CoreError
	 *
	 * Purpose:
	 * - Bridge early-phase (no events) and runtime-phase (events available)
	 *
	 * @param key - Built-in event key
	 * @param options - Event payload
	 * @param fallback - Fallback error metadata if event system is unavailable
	 *
	 * @throws CoreError if events system is not ready
	 */
	public emitOrThrow<K extends keyof BuiltinEvents>(
		key: K,
		options?: EmitOptionsForKey<BuiltinEvents, K>,
		fallback?: {
			source: string
			desc: string
		}
	) {
		if (this.ctx.ready.events) {
			return this.ctx.events.internalEmit(key, options);
		}

		throw new CoreError(
			key as string,
			fallback?.source ?? "unknown",
			fallback?.desc ?? "Event system not ready"
		);
	}

	/**
	 * castEnvValue
	 *
	 * Casts a string environment value to the type of a default value.
	 *
	 * Supported types:
	 * - boolean ("true", "false", "1", "0")
	 * - number
	 * - string (fallback)
	 *
	 * Behavior:
	 * - Normalizes input (trim, quotes removal, lowercase)
	 * - Returns defaultValue if parsing fails
	 *
	 * @param value - Raw environment value
	 * @param defaultValue - Reference value used for type inference
	 *
	 * @returns Parsed value or defaultValue
	 */
	public castEnvValue<T>(value: string, defaultValue: T): T {
		const normalized = value
			.trim()
			.replace(/^["']|["']$/g, "")
			.toLowerCase();

		const defaultType = typeof defaultValue;

		if (defaultType === "boolean") {
			if (normalized === "true" || normalized === "1") return true as T;
			if (normalized === "false" || normalized === "0") return false as T;
			return defaultValue;
		}

		if (defaultType === "number") {
			const num = Number(normalized);
			return (Number.isNaN(num) ? defaultValue : num) as T;
		}

		return normalized as T;
	}

	/**
	 * loadEnvFile
	 *
	 * Loads and parses a .env-like file.
	 *
	 * Behavior:
	 * - Ignores empty lines and comments (#)
	 * - Parses KEY=VALUE pairs
	 * - Does not support advanced dotenv features (intentional)
	 *
	 * @param filePath - Path to env file
	 *
	 * @returns Parsed key/value object
	 */
	public loadEnvFile(
		filePath?: string
	): Record<string, string> {
		if (!filePath || !this.ctx.providers.fs.fileExist(filePath)) return {};

		const content = this.ctx.providers.fs.readTextFile(filePath);
		const env: Record<string, string> = {};

		for (const rawLine of content.split("\n")) {
			const line = rawLine.trim();

			if (!line || line.startsWith("#")) continue;

			const eqIndex = line.indexOf("=");
			if (eqIndex === -1) continue;

			const key = line.slice(0, eqIndex).trim();
			const value = line.slice(eqIndex + 1).trim();

			if (!key) continue;

			env[key] = value;
		}

		return env;
	}

	/**
	 * getDisplayStageName
	 *
	 * Returns a user-friendly stage name.
	 *
	 * Rules:
	 * - Non-default stages → returned as-is
	 * - Default stage:
	 *   - If not renamed → "default"
	 *   - If renamed → "custom(default)"
	 *
	 * @param stageName - Internal stage name
	 * @param defaultName - Optional overridden default name
	 *
	 * @returns Display-friendly stage name
	 */
	public getDisplayStageName(
		stageName: string,
		defaultName?: string
	): string {
		if (stageName !== 'default') {
			return stageName;
		}

		if (!defaultName || defaultName === 'default') {
			return 'default';
		}

		return `${defaultName}(default)`;
	}
}
