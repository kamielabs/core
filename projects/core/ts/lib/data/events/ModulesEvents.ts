import {
	CoreEventKind,
	CoreEventLevel,
	CoreEventPhase,
	CoreEventScope,
	CoreEventsShape
} from "@types";

// TODO: When builtins and customs will be managed separately, we'll have to create i18n CoreErrors into signal events

/**
 * Builtin modules event declarations.
 *
 * Covers modules state guards, module/action structure validation failures,
 * modules lifecycle flow events, and final action-runner lookup failures.
 */
export const BUILTIN_MODULES_EVENTS = {
	// INIT/DICTS FATAL ERRORS
	modulesMissingDraft: {
		name: 'core.modules.missing.draft',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	modulesAlreadyResolved: {
		name: 'core.modules.already.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	modulesMissingResolved: {
		name: 'core.modules.missing.resolved',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	// Globals Indexes Fatal & Error (have to be signals)
	modulesConflictModule: {
		name: 'core.modules.conflict.module',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	modulesConflictAction: {
		name: 'core.modules.conflict.action',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	moduleDuplicateFlag: {
		name: 'core.module.duplicate.flag',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	actionDuplicateFlag: {
		name: 'core.action.duplicate.flag',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.signal,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.app
	},
	// FLOW messages
	modulesInit: {
		name: 'core.modules.init',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.core
	},
	modulesHooking: {
		name: 'core.modules.hooking',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.core
	},
	modulesReady: {
		name: 'core.modules.ready',
		level: CoreEventLevel.trace,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.core,
		trigger: true // Event Triggers are set up on runtime.init(for first flow event) and then ready phase
	},
	modulesMissingActionHook: {
		name: 'core.modules.missing.action.hook',
		level: CoreEventLevel.fatal,
		kind: CoreEventKind.message,
		phase: CoreEventPhase.modules,
		scope: CoreEventScope.core
	},
	// Flow Errors
} as const satisfies CoreEventsShape;
