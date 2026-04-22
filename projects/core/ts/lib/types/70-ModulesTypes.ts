import {
	BuiltinModules,
	FinalModules,
} from "@data";

import {
	ActionFlag,
	ModuleFlag,
	ParsedOptionValue
} from "@types";


/**
 * !!! Only Informative declaration !!! no hook, no run yet,
 */

type ActionWithOptions = { options?: Record<string, ActionFlag> };
type ActionWithoutOptions = { options?: never };

type ActionWithAliases = { aliases?: string[] };
type ActionWithoutAliases = { aliases?: never };

export type ActionBase = {
	description?: string;
	signature?: string[]; // "default help display like "<value> [index]"
}

export type SingleAction = ActionBase
	& ActionWithoutAliases
	& ActionWithoutOptions;


export type DefaultAction = ActionBase
	& ActionWithoutAliases
	& ActionWithOptions;

export type ModuleAction = ActionBase
	& ActionWithAliases
	& ActionWithOptions;

export type ActionInfos = SingleAction | DefaultAction | ModuleAction;

type ModuleBase = {
	description?: string;
}

type ModuleWithGroup = { group?: string; };
type ModuleWithAliases = { aliases?: string[]; };
type ModuleWithOptions = { options?: Record<string, ModuleFlag>; };

type ModuleWithActions = { actions?: Record<string, ModuleAction>; };
type ModuleWithSingleAction = { singleAction?: Record<'__singleAction__', SingleAction>; };
type ModuleWithDefaultAction = { defaultAction?: Record<'__defaultAction__', DefaultAction>; };

type ModuleWithoutGroup = { group?: never; };
type ModuleWithoutAliases = { aliases?: never; };
type ModuleWithoutOptions = { options?: never; };
type ModuleWithoutActions = { actions?: never; };
type ModuleWithoutSingleAction = { singleAction?: never; };
type ModuleWithoutDefaultAction = { defaultAction?: never; };

/**
 * SingleActionModule
 *
 * Represents a CLI with a single execution entry point.
 *
 * Constraints:
 * - Must define exactly one action (`__singleAction__`)
 * - Cannot define:
 *   - module-level options
 *   - action-level options
 *   - aliases
 *   - grouping
 *
 * Behavior:
 * - Execution is implicit (no module/action selection from CLI)
 * - Only global flags are available
 *
 * Typical use-case:
 * - Simple CLI tools with a single command
 */
export type SingleActionModule = ModuleBase
	& ModuleWithoutAliases // No Aliases
	& ModuleWithoutGroup // No Group
	& ModuleWithoutOptions // No Options
	& ModuleWithSingleAction
	& ModuleWithoutDefaultAction
	& ModuleWithoutActions;

/**
 * DefaultActionModule
 *
 * Represents a module with a single default action.
 *
 * Constraints:
 * - Must define exactly one default action (`__defaultAction__`)
 * - Cannot define:
 *   - multiple actions
 *   - module-level options
 *
 * Behavior:
 * - Action is executed implicitly when module is called
 * - Supports action-level flags
 *
 * Typical use-case:
 * - Simple module with optional parameters
 */
export type DefaultActionModule = ModuleBase
	& ModuleWithAliases // Aliases
	& ModuleWithGroup // Group
	& ModuleWithoutOptions // No Options
	& ModuleWithoutSingleAction
	& ModuleWithDefaultAction
	& ModuleWithoutActions;

/**
 * ActionsModule
 *
 * Represents a fully modular CLI module.
 *
 * Constraints:
 * - Must define multiple named actions
 * - Cannot define:
 *   - singleAction
 *   - defaultAction
 *
 * Behavior:
 * - Requires explicit action selection
 * - Supports:
 *   - module-level flags
 *   - action-level flags
 *   - aliases
 *
 * Typical use-case:
 * - Complex CLI modules with multiple commands
 */
export type ActionsModule = ModuleBase
	& ModuleWithAliases // Aliases
	& ModuleWithGroup // Group
	& ModuleWithOptions // Options
	& ModuleWithoutSingleAction
	& ModuleWithoutDefaultAction
	& ModuleWithActions;

export type ModuleInfos = SingleActionModule | DefaultActionModule | ActionsModule;

// -----------------------------------------------------
// INDEXES
// -----------------------------------------------------

export interface ModuleIndex {
	byName: {
		[Module: string]: ModuleInfos
	}
	byAlias: {
		[Alias: string]: string
	}
}

export interface ActionIndex {
	byModule: {
		[Module: string]:
		{
			byName: {
				[Action: string]: ActionInfos
			}
			byAlias: {
				[AliasName: string]: string
			}
		}
	}
}

export interface ModuleFlagIndexEntry {
	scope: "module"
	module: string
	optionName: string
}

export interface ActionFlagIndexEntry {
	scope: "action"
	module: string
	action: string
	optionName: string
}

export interface ModuleFlagIndexEntries {
	[Module: string]: {
		byKey: {
			[Flag: string]: ModuleFlagIndexEntry
		}
	}
}

export interface ActionFlagIndexEntries {
	[Module: string]: {
		[Action: string]: {
			byKey: {
				[Flag: string]: ActionFlagIndexEntry
			}
		}
	}
}

export interface ModulesFlagIndex {
	module: ModuleFlagIndexEntries;
	action: ActionFlagIndexEntries;
}


// -----------------------------------------------------
// MODULES SHAPE
// -----------------------------------------------------
export type CoreSingleModulesShape = {
	__defaultModule__: SingleActionModule;
}

export type CoreMultiModulesShape = {
	[Name: string]: DefaultActionModule | ActionsModule;
};
export type CoreModulesShape =
	| CoreSingleModulesShape
	| CoreMultiModulesShape;


export interface CoreModulesShapeDecl<
	TModules extends CoreModulesShape
> {
	modules: FinalModules<TModules>,
	moduleIndex: ModuleIndex,
	actionIndex: ActionIndex,
	flagIndex: ModulesFlagIndex
}


export interface RuntimeModuleFacts {
	moduleName: string;
	moduleOptions: Record<string, ParsedOptionValue>;

	actionName: string
	actionOptions: Record<string, ParsedOptionValue>

	args: string[]
}

// -----------------------------------------------------
// Export and Concat Builtins & Customs
// -----------------------------------------------------
export type BuiltinModuleKey<TModules extends CoreModulesShape> = Extract<keyof FinalModules<TModules>, keyof BuiltinModules>;
export type CustomModuleKey<TModules extends CoreModulesShape> = Extract<keyof FinalModules<TModules>, keyof TModules>;

// -----------------------------------------------------
// Module and Action Options Context Types
// -----------------------------------------------------
type ExtractActionsContainer<T> =
	T extends { actions: infer ACT }
	? ACT
	: T extends { defaultAction: infer DEF }
	? DEF
	: T extends { singleAction: infer SINGLE }
	? SINGLE
	: never;

type ModulesWithActionContainer<TModules extends CoreModulesShape> = {
	[M in keyof FinalModules<TModules>]:
	ExtractActionsContainer<FinalModules<TModules>[M]> extends never
	? never
	: M
}[keyof FinalModules<TModules>];

type ModulesWithOptions<TModules extends CoreModulesShape> = {
	[M in keyof FinalModules<TModules>]:
	FinalModules<TModules>[M] extends { options: any }
	? M
	: never
}[keyof FinalModules<TModules>];

export type BuiltinModuleWithOptionsKey<
	TModules extends CoreModulesShape
> = Extract<
	BuiltinModuleKey<TModules>,
	ModulesWithOptions<TModules>
>;

export type CustomModuleWithOptionsKey<
	TModules extends CoreModulesShape
> = Extract<
	CustomModuleKey<TModules>,
	ModulesWithOptions<TModules>
>;

export type BuiltinModuleWithActionKey<
	TModules extends CoreModulesShape
> = Extract<
	BuiltinModuleKey<TModules>,
	ModulesWithActionContainer<TModules>
>;

export type CustomModuleWithActionKey<
	TModules extends CoreModulesShape
> = Extract<
	CustomModuleKey<TModules>,
	ModulesWithActionContainer<TModules>
>;

type ExtractModuleFlags<T> =
	T extends { options: infer OPT }
	? {
		[K in keyof OPT as OPT[K] extends { long: infer L extends string } ? L : never]:
		OPT[K] extends { __type: infer U }
		? U
		: ParsedOptionValue
	}
	: {};

export type BuiltinModuleFlags<
	TModules extends CoreModulesShape,
	M extends BuiltinModuleWithOptionsKey<TModules>
> = ExtractModuleFlags<FinalModules<TModules>[M]>;

export type CustomModuleFlags<
	TModules extends CoreModulesShape,
	M extends CustomModuleWithOptionsKey<TModules>
> = ExtractModuleFlags<TModules[M]>;

// -----------------------------------------------------
// Actions types & Context
// -----------------------------------------------------

export type BuiltinActions<
	TModules extends CoreModulesShape,
	M extends BuiltinModuleKey<TModules>
> = ExtractActionsContainer<BuiltinModules[M]>;

export type CustomActions<
	TModules extends CoreModulesShape,
	M extends CustomModuleKey<TModules>
> = ExtractActionsContainer<TModules[M]>;

type ExtractActionFlags<T> =
	T extends { options: infer OPT }
	? {
		[K in keyof OPT as OPT[K] extends { long: infer L extends string } ? L : never]:
		OPT[K] extends { __type: infer U }
		? U
		: ParsedOptionValue
	}
	: {};

export type BuiltinActionFlags<
	TModules extends CoreModulesShape,
	M extends BuiltinModuleKey<TModules>,
	A extends keyof BuiltinActions<TModules, M>
> = ExtractActionFlags<BuiltinActions<TModules, M>[A]>;

export type CustomActionFlags<
	TModules extends CoreModulesShape,
	M extends CustomModuleKey<TModules>,
	A extends keyof CustomActions<TModules, M>
> = ExtractActionFlags<CustomActions<TModules, M>[A]>;
