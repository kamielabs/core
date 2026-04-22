// TODO: V0.1 — Implement setCwd() tool in ToolsService (required for WSC integration)
// NOTE:
// - setCwd() is exposed in hook context but not yet implemented
// - Must provide controlled mutation via RuntimeService (no direct state mutation)
import {
	CoreEventsShape,
	CoreGlobalsShape,
	CoreModulesShape,
	CoreStagesShape,
	CoreTranslationsShape,
	ParsedOptionValue,
	RuntimeCoreFacts,
	RuntimeStageFacts
} from "@types";
import { EmitSignalHookMethod } from "./10-EventsContext";
import { SnapshotFullContext } from "./20-SnapshotContext";
import { StagesManager } from "@managers";

/**
 * Tools exposed to a stage hook.
 *
 * These tools are the ONLY allowed mutation / side-effect surface
 * available to the developer inside a stage hook.
 *
 * Notes:
 * - No direct mutation of runtime facts is allowed
 * - All interactions must go through controlled tools
 */
export type ToolsStageContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape
> = {
	/**
	 * Emit a signal event (internal or user-defined).
	 *
	 * Can be used for:
	 * - logging
	 * - warnings
	 * - fatal errors (depending on event level)
	 */
	signal: EmitSignalHookMethod<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Set working directory (planned feature).
	 *
	 * Will allow controlled mutation of cwd via runtime service.
	 * Currently not implemented.
	 */
	setCwd: () => void;
};

/**
 * Runtime context available inside a stage hook.
 *
 * This contains only resolved runtime facts.
 *
 * Notes:
 * - Read-only by design
 * - Reflects the current state of the core at stage execution time
 */
export type RuntimeStageContext = {
	/**
	 * Core bootstrap facts (platform, env, etc.)
	 */
	bootstrap: RuntimeCoreFacts;

	/**
	 * Current resolved stage facts
	 */
	stage: RuntimeStageFacts;
};

/**
 * Full context passed to a stage hook.
 *
 * This is the main DX surface for stage-level logic.
 *
 * Contains:
 * - resolved options
 * - runtime facts
 * - tools
 * - snapshot of full system
 */
export type StageHookContext<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TOptions = Record<string, ParsedOptionValue>
> = {
	/**
	 * Resolved stage options.
	 *
	 * - Keys are inferred from declaration
	 * - Values are runtime-resolved and type-widened
	 */
	options: TOptions;

	/**
	 * Controlled tools for emitting events and performing side-effects
	 */
	tools: ToolsStageContext<TEvents, TStages, TGlobals, TModules, TTranslations>;

	/**
	 * Runtime facts (read-only)
	 */
	runtime: RuntimeStageContext;

	/**
	 * Full snapshot of all resolved dictionaries
	 *
	 * Useful for:
	 * - introspection
	 * - debug
	 * - cross-manager awareness
	 */
	snapshot: SnapshotFullContext<TEvents, TStages, TGlobals, TModules, TTranslations>;
};

/**
 * Stage hook definition.
 *
 * A stage hook is executed after:
 * - options resolution
 * - builtin defaults application
 * - core invariant validation
 *
 * Notes:
 * - Can be sync or async
 * - Must not mutate runtime directly
 * - Must use provided tools for side-effects
 */
export type StageHook<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
	TOptions = Record<string, ParsedOptionValue>
> = (
	ctx: StageHookContext<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations,
		TOptions
	>
) => void | Promise<void>;

/**
 * Method exposed to override builtin default stage values.
 *
 * This allows the developer to:
 * - override default stage file
 * - override builtin options (lang, workingDir, etc.)
 *
 * Notes:
 * - Only affects the draft state during resolution
 * - Applied BEFORE core invariant hook
 */
export type StagesDefaultHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
> =
	StagesManager<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	>["overrideDefaultStage"];

/**
 * Method to register a hook on a builtin stage.
 *
 * Notes:
 * - Only applies to builtin stages (ex: "default")
 * - Options type is strictly inferred from builtin declarations
 */
export type StagesBuiltinHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
> =
	StagesManager<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	>["registerBuiltinStageHook"];

/**
 * Method to register a hook on a custom stage.
 *
 * Notes:
 * - Only applies to user-defined stages
 * - Options type is inferred from custom declarations
 */
export type StagesCustomHookMethod<
	TEvents extends CoreEventsShape,
	TStages extends CoreStagesShape,
	TGlobals extends CoreGlobalsShape,
	TModules extends CoreModulesShape,
	TTranslations extends CoreTranslationsShape,
> =
	StagesManager<
		TEvents,
		TStages,
		TGlobals,
		TModules,
		TTranslations
	>["registerCustomStageHook"];
