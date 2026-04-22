import { BuiltinStages, FinalStages } from "@data";
import { Option, ParsedOptionValue } from "@types";

/**
 * Stage option declaration.
 *
 * A stage option is declared from:
 * - an ENV variable name (`env`)
 * - a default value (`default`)
 * - an optional description
 *
 * At declaration time, the option keeps its source type.
 * At runtime, the option will be resolved to a concrete value.
 */
export type StageOption = Option<string, ParsedOptionValue>;

/**
 * Dictionary of declarative stage options.
 *
 * Key = logical option name used inside the stage definition.
 * Value = stage option declaration.
 */
export type StageOptions = Record<string, StageOption>;

/**
 * Declarative shape of a single stage.
 *
 * - `file` is the env file associated to the stage
 * - `options` contains all declarative stage options
 *
 * Notes:
 * - `file` stays outside of `options` because it is used first to load
 *   the env file before resolving option values.
 * - `options` contains both builtin and custom stage options.
 */
export type StageShape = {
	file?: string;
	options: StageOptions;
};

/**
 * Full user-defined stages dictionary.
 *
 * Key = stage name
 * Value = stage declaration
 */
export type CoreStagesShape = {
	[stageName: string]: StageShape;
};

/**
 * Stage name index.
 *
 * This index gives direct access to a stage declaration from its name.
 * It avoids re-walking the whole declarative dictionary during resolution.
 */
export type StageIndex = {
	byName: Record<string, StageShape>;
};

/**
 * Full ENV index entry for stages.
 *
 * This is the detailed runtime mapping used by the stage manager.
 */
export interface StageEnvIndexEntry {
	/**
	 * Real ENV variable name, ex: NODE_CLI_LANG
	 */
	env: string;

	/**
	 * Stage name owning this ENV declaration.
	 */
	stageName: string;

	/**
	 * Logical option name inside the stage declaration.
	 */
	optionName: string;
}

/**
 * ENV index grouped by stage.
 *
 * Shape:
 * - byStage
 *   - [stageName]
 *     - byEnv
 *       - [envName] -> StageEnvIndexEntry
 *
 * This structure is kept because other managers already rely on this
 * lookup model, so it remains part of the internal shared API.
 */
export interface StageEnvIndex {
	byStage: Record<
		string,
		{
			byEnv: Record<string, StageEnvIndexEntry>;
		}
	>;
}

/**
 * Full declarative dictionary owned by StagesManager.
 *
 * It contains:
 * - all final stages (builtin + custom)
 * - stage index
 * - ENV index
 */
export type CoreStagesShapeDecl<TStages extends CoreStagesShape> = {
	/**
	 * Final declared stages dictionary.
	 *
	 * This is the merged source of truth used by the manager:
	 * builtin stages + user custom stages.
	 */
	stages: FinalStages<TStages>;

	/**
	 * ENV lookup index.
	 */
	envIndex: StageEnvIndex;

	/**
	 * Stage name lookup index.
	 */
	stageIndex: StageIndex;
};

/**
 * Resolved runtime facts for the active stage.
 *
 * This type represents the final resolved state after:
 * - declaration reading
 * - env file loading
 * - ENV overrides
 * - builtin defaults overrides
 * - stage hooks processing
 *
 * Notes:
 * - `name` is the real internal stage key used by the core
 * - `file` is the resolved env file path
 * - `options` contains resolved runtime values only
 */
export type RuntimeStageFacts = {
	/**
	 * Internal stage name effectively used by the core.
	 */
	name: string;

	/**
	 * Resolved env file associated to the active stage.
	 */
	file: string;

	/**
	 * Final resolved stage options.
	 *
	 * Key = logical option name
	 * Value = final runtime value
	 */
	options: Record<string, ParsedOptionValue>;
};

/* -------------------------------------------------------------------------- */
/* Hook typing utilities                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Builtin stage keys available in the final stages dictionary.
 *
 * This type is used to target builtin stages while keeping them correlated
 * to the merged final stages dictionary.
 */
export type BuiltinStageKey<TStages extends CoreStagesShape> =
	Extract<keyof FinalStages<TStages>, keyof BuiltinStages>;

/**
 * Custom stage keys declared by the developer.
 *
 * Only user-defined stages are extracted here.
 */
export type CustomStageKey<TStages extends CoreStagesShape> =
	Extract<keyof FinalStages<TStages>, keyof TStages>;

/**
 * Widen a literal type to its runtime primitive counterpart.
 *
 * Examples:
 * - "fr" -> string
 * - 42 -> number
 * - true -> boolean
 *
 * This is important for stage hooks because hooks work on runtime values,
 * not on exact declaration literals.
 */
type WidenLiteral<T> =
	T extends string ? string :
	T extends number ? number :
	T extends boolean ? boolean :
	T;

/**
 * Extract resolved runtime options from a stage declaration.
 *
 * Input:
 * - a stage declaration containing `options`
 *
 * Output:
 * - an object keyed by declared option names
 * - each value widened from the declared default type
 *
 * Example:
 * {
 *   lang: Option<"NODE_CLI_LANG", "en">
 * }
 *
 * becomes:
 * {
 *   lang: string
 * }
 */
export type ExtractStageOptions<T> =
	T extends { options: infer OPT extends StageOptions }
	? {
		[K in keyof OPT]:
		OPT[K] extends Option<string, infer D>
		? WidenLiteral<D>
		: ParsedOptionValue;
	}
	: {};

/**
 * Builtin default stage options.
 *
 * This type is used by the DX helper allowing the developer to override
 * builtin default-stage values before final runtime resolution.
 *
 * Important:
 * - only builtin options are exposed here
 * - custom options added to the builtin stage are intentionally excluded
 */
export type DefaultStageOptions = ExtractStageOptions<BuiltinStages["default"]>;

/**
 * Resolved options shape for a builtin stage hook.
 *
 * The hook receives:
 * - builtin declared keys
 * - runtime-friendly widened value types
 */
export type BuiltinStageOptions<
	TStages extends CoreStagesShape,
	K extends BuiltinStageKey<TStages>
> = ExtractStageOptions<FinalStages<TStages>[K]>;

/**
 * Resolved options shape for a custom stage hook.
 *
 * The hook receives:
 * - custom declared keys
 * - runtime-friendly widened value types
 */
export type CustomStageOptions<
	TStages extends CoreStagesShape,
	K extends CustomStageKey<TStages>
> = ExtractStageOptions<TStages[K]>;
