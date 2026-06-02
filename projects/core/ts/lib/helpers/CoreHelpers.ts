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
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape
} from "@types";

/**
 * CoreHelpers
 *
 * Context-bound helper utility class.
 *
 * Responsibilities:
 * - Provide reusable low-level core utilities
 * - Wrap file/runtime operations behind the active context providers
 * - Bridge early-phase and runtime behaviors
 * - Expose utility methods requiring providers or context access
 *
 * Design:
 * - Not static (requires Context access)
 * - Exposed as `ctx.helpers.core.*`
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
	 * Deep-freeze an object graph in place.
	 *
	 * This helper is used to enforce the core's immutable runtime and
	 * declaration snapshots once a manager reaches its finalized state.
	 *
	 * @param obj - Value to recursively freeze
	 * @returns The same frozen value
	 */
	public deepFreeze<T>(obj: T): T {
		if (!obj || typeof obj !== "object") return obj;

		Object.freeze(obj);

		for (const key of Object.keys(obj as any)) {
			const value = (obj as any)[key];
			if (value && typeof value === "object" && !Object.isFrozen(value)) {
				this.deepFreeze(value);
			}
		}

		return obj;
	}

	/**
	 * Deep-clone a value using the platform structured clone algorithm.
	 *
	 * Used by the core to isolate mutable drafts from resolved/frozen snapshots.
	 *
	 * @param obj - Value to clone
	 * @returns A detached clone of the input value
	 */
	public deepClone<T>(obj: T): T {
		return structuredClone(obj);
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
	 * - Keeps the default value type as the casting contract
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
	 * - Uses the active filesystem provider through the bound context
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
	 * This is a display helper only: it does not alter the internal runtime
	 * stage key used by the core.
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

	public static isValidRuntimeName(
		key: string,
		isBuiltin: boolean
	): string {
		/**
		 * Convert camelCase to SCREAMING_SNAKE_CASE
		 */
		const normalized = key
			.replace(/([a-z0-9])([A-Z])/g, "$1.$2")
			.toLowerCase();

		/**
		 * Builtin expected format:
		 * core.*
		 */
		const expected = isBuiltin
			? `core.${normalized}`
			: normalized;

		return expected;
	}

	public isValidRuntimeName(
		key: string,
		isBuiltin: boolean
	) {
		return CoreHelpers.isValidRuntimeName(key, isBuiltin);
	}
}
