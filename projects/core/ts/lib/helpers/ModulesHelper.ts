// NOTE:
// - ModuleHelpers contains low-level utilities for module/action resolution
// - It is heavily used during parsing and index construction
// - Most logic here is deterministic and relies on pre-built indexes

// WARNING:
// - These helpers assume that indexes (ModuleIndex, ActionIndex, FlagIndexEntries) are already valid
// - No validation is performed here (delegated to Managers)
// - Incorrect indexes WILL lead to inconsistent parsing behavior

// TODO: ARCHITECTURE — Integrate into ctx.helpers.* (context-bound helpers)

import { FinalModules } from "@data";
import {
	ActionFlagIndexEntries,
	ActionIndex,
	CoreModulesShape,
	FlagIndex,
	IndexedFlag,
	ModuleFlagIndexEntries,
	ModuleIndex
} from "@types";

/**
 * ModulesHelpers
 *
 * Static helper class for:
 * - module/action resolution
 * - alias handling
 * - parser flag index construction
 *
 * Design:
 * - Pure functions (no side-effects)
 * - Operates on precomputed indexes
 */
export class ModulesHelpers {

	constructor() { };

	/**
	 * Type guard: checks if object has "options"
	 */
	public static hasOptions(obj: unknown): obj is { options: Record<string, any> } {
		return typeof obj === 'object' && obj !== null && "options" in obj;
	}

	/**
	 * Type guard: checks if object has "actions"
	 */
	public static hasActions(obj: unknown): obj is { actions: Record<string, any> } {
		return typeof obj === 'object' && obj !== null && "actions" in obj;
	}

	/**
	 * Type guard: checks if object has "defaultAction"
	 */
	public static hasDefaultAction(obj: unknown): obj is { defaultAction: Record<string, any> } {
		return typeof obj === 'object' && obj !== null && "defaultAction" in obj;
	}

	/**
	 * buildParserFlagIndexFromModule
	 *
	 * Builds a flat FlagIndex for module-level options.
	 *
	 * Algorithm:
	 * 1. Iterate over moduleIndex entries (precomputed)
	 * 2. Resolve module DSL
	 * 3. For each CLI flag key:
	 *    - retrieve option metadata from DSL
	 *    - build IndexedFlag entry
	 * 4. Flatten everything into a single byKey map
	 *
	 * Output:
	 * - { byKey: { "--flag": IndexedFlag, "-f": IndexedFlag } }
	 *
	 * Notes:
	 * - Only modules with "options" are considered
	 * - Index is fully flat (no module nesting at runtime)
	 *
	 * @returns FlagIndex
	 */
	public static buildParserFlagIndexFromModule<
		TModules extends CoreModulesShape
	>(
		modules: FinalModules<TModules>,
		moduleIndex: ModuleFlagIndexEntries
	): FlagIndex {

		const byKey: Record<string, IndexedFlag> = {};

		for (const moduleName in moduleIndex) {

			const moduleEntry = moduleIndex[moduleName];
			const moduleKey = moduleName as keyof FinalModules<TModules>;
			const moduleDSL = modules[moduleKey];

			if (!moduleEntry || !this.hasOptions(moduleDSL)) continue;

			for (const key in moduleEntry.byKey) {

				const opt = moduleEntry.byKey[key];
				if (!opt) continue;

				const cliOption = moduleDSL.options[opt.optionName as keyof typeof moduleDSL.options];
				if (!cliOption) continue;

				byKey[key] = {
					key,
					raw: key.replace(/^-+/, ""),
					kind: key.startsWith("--") ? "long" : "short",
					optionName: opt.optionName,
					groupName: moduleName,
					cliOption
				};
			}
		}

		return { byKey };
	}

	/**
	 * buildParserFlagIndexFromAction
	 *
	 * Builds a flat FlagIndex for action-level options.
	 *
	 * Algorithm:
	 * 1. Iterate over actionIndex grouped by module
	 * 2. Resolve module DSL
	 * 3. Determine action container:
	 *    - module.actions
	 *    - OR module.defaultAction
	 * 4. For each action:
	 *    - retrieve action DSL
	 *    - iterate over flags
	 *    - map to IndexedFlag entries
	 *
	 * Notes:
	 * - Supports both multi-action modules and defaultAction modules
	 * - Produces a flat index for parser usage
	 *
	 * @returns FlagIndex
	 */
	public static buildParserFlagIndexFromAction<
		TModules extends CoreModulesShape
	>(
		modules: FinalModules<TModules>,
		actionIndex: ActionFlagIndexEntries
	): FlagIndex {

		const byKey: Record<string, IndexedFlag> = {};

		for (const moduleName in actionIndex) {

			const moduleActions = actionIndex[moduleName];
			const moduleKey = moduleName as keyof FinalModules<TModules>;
			const moduleDSL = modules[moduleKey];

			if (!moduleActions || !moduleDSL) continue;

			const container =
				this.hasActions(moduleDSL)
					? moduleDSL.actions
					: this.hasDefaultAction(moduleDSL)
						? moduleDSL.defaultAction
						: undefined;

			if (!container) continue;

			for (const actionName in moduleActions) {

				const actionEntry = moduleActions[actionName];
				const actionDSL = container[actionName as keyof typeof container];

				if (!actionEntry || !this.hasOptions(actionDSL)) continue;

				for (const key in actionEntry.byKey) {

					const opt = actionEntry.byKey[key];
					if (!opt) continue;

					const cliOption = actionDSL.options[opt.optionName as keyof typeof actionDSL.options];
					if (!cliOption) continue;

					byKey[key] = {
						key,
						raw: key.replace(/^-+/, ""),
						kind: key.startsWith("--") ? "long" : "short",
						optionName: opt.optionName,
						groupName: moduleName,
						cliOption
					};
				}
			}
		}

		return { byKey };
	}

	/**
	 * actionKey
	 *
	 * Generates a unique action key.
	 *
	 * Format:
	 * - "module.action"
	 */
	public static actionKey(module: string, action: string): string {
		return `${module}.${action}`;
	}

	/**
	 * moduleExists
	 *
	 * Checks if a module exists by:
	 * - direct name
	 * - alias
	 */
	public static moduleExists(index: ModuleIndex, name: string): boolean {

		if (index.byName[name]) return true;

		if (index.byAlias[name]) return true;

		return false;
	}

	/**
	 * resolveModuleName
	 *
	 * Resolves module name from:
	 * - direct name
	 * - alias
	 *
	 * Fallback:
	 * - returns input if not found
	 */
	public static resolveModuleName(index: ModuleIndex, name: string): string {

		if (index.byName[name]) return name;

		const alias = index.byAlias[name];

		if (alias) return alias;

		return name;
	}

	/**
	 * actionExists
	 *
	 * Checks if an action exists within a module:
	 * - by name
	 * - by alias
	 */
	public static actionExists(
		index: ActionIndex,
		module: string,
		action: string
	): boolean {

		const moduleActions = index.byModule[module];

		if (!moduleActions) return false;

		if (moduleActions.byName[action]) return true;

		if (moduleActions.byAlias[action]) return true;

		return false;
	}

	/**
	 * resolveActionName
	 *
	 * Resolves action name from:
	 * - direct name
	 * - alias
	 *
	 * Fallback:
	 * - returns input if not found
	 */
	public static resolveActionName(
		index: ActionIndex,
		module: string,
		action: string
	): string {

		const moduleActions = index.byModule[module];

		if (!moduleActions) return action;

		if (moduleActions.byName[action]) return action;

		const alias = moduleActions.byAlias[action];

		if (alias) return alias;

		return action;
	}
}
