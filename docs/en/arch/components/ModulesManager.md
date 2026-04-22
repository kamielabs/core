# 🧱 ModulesManager

## Description

`ModulesManager` is the runtime component responsible for resolving the functional structure of the CLI.

It determines:

* the active module
* the action to execute
* the options associated with the module and action
* the remaining arguments

It acts as the boundary between:

* runtime configuration (bootstrap, stages, globals)
* and business execution (action)

It is also the last manager executed before the runtime is fully frozen.

---

## Purpose

`ModulesManager` transforms the CLI input into a **clear execution intent**.

It answers key questions:

* which module is targeted?
* which action should be executed?
* which options are associated with this action?
* which arguments should be passed to the business logic?

Its goal is to produce a complete `RuntimeModuleFacts`, used to execute the corresponding action.

---

## Why This Manager Exists

After bootstrap, stage, and globals phases, the runtime has:

* a stabilized environment
* resolved global options
* a ready parser

But it still does not know **what to execute**.

`ModulesManager` resolves this final step:

> transform CLI input into a precise execution target.

It centralizes:

* module selection
* action selection
* execution mode handling
* fallback management
* binding to execution hooks

---

## Execution Modes

The manager supports multiple execution modes.

---

### Modules + Actions Mode

Standard case:

* a module is selected
* an action is chosen within the module

---

### DefaultAction Mode

A module may define a default action.

In this case:

* the module can be called without explicitly specifying an action
* the default action is automatically selected

---

### SingleAction Mode

A runtime may be defined with a single entry point.

In this case:

* no module or action is explicitly provided in the CLI
* a single action is executed automatically

This mode is useful for simple or encapsulated CLIs.

---

## Global Overrides Handling

Some built-in global options can bypass standard resolution.

In v0.1:

* `--help` / `-h`
* `--version` / `-v`

These flags directly map to built-in modules (`help`, `version`), bypassing normal module/action resolution.

This ensures consistent behavior even in `singleAction` mode.

---

## Resolution Order

Resolution follows a deterministic flow:

1. check global overrides (`help`, `version`)
2. check `singleAction` mode
3. otherwise, ask the parser to resolve:

   * module
   * action
   * associated flags
4. retrieve final parser context
5. build `RuntimeModuleFacts`

The parser handles syntax.

The manager defines runtime truth.

---

## What This Manager Produces

The manager produces `RuntimeModuleFacts` containing:

* `moduleName`
* `moduleOptions`
* `actionName`
* `actionOptions`
* `args`

These represent the final execution intent.

---

## Internal Behavior

Resolution follows a structured sequence:

1. build internal indexes (modules, actions, flags)
2. validate declaration consistency
3. determine runtime mode
4. ask parser to resolve module/action phase
5. build final runtime
6. execute optional module hook
7. freeze dictionary
8. mark manager as resolved

---

## Internal Indexes

The manager builds several indexes for fast, deterministic resolution:

### Module Index

* access by name
* access by alias

---

### Action Index

* per module
* access by name
* access by alias

---

### Flag Index

* module flags
* action flags

These indexes allow the parser to operate efficiently without scanning the entire declarative structure.

---

## Internal Validation

The manager enforces several invariants:

* a module can define only one action type:

  * `actions`
  * `defaultAction`
  * `singleAction`
* runtime cannot mix `__defaultModule__` with other modules
* structural collisions are forbidden

These rules ensure a clear and unambiguous execution model.

---

## Hooks and Customization

`ModulesManager` introduces two types of hooks.

---

### Module Hook (`ModuleHook`)

Executed after module resolution.

Allows interaction with:

* module options
* partially mutable runtime

At this stage:

* runtime is not fully frozen
* mutation is already highly restricted

Used to:

* adjust module-level behavior
* prepare execution context

---

### Action Hook (`ActionHook`)

Represents the **actual execution of the action**.

At this stage:

* runtime is fully resolved and frozen
* core has no more business responsibility

The hook receives:

* action options
* final runtime
* core tools
* snapshot

This is where business logic is implemented.

---

## Hook Context

### ModuleHook

* runtime: partial (not frozen)
* options: module options
* tools: limited access
* snapshot: complete

---

### ActionHook

* runtime: complete and frozen
* options: action options
* tools: limited access
* snapshot: complete

---

## Available Tools

At this stage, tools are intentionally limited.

In v0.1:

* `signal()`
* `message()`

This allows:

* event emission
* i18n usage

No structural runtime mutation is allowed.

---

## Runner

`ModulesManager` exposes a key method: `runner()`.

This method is used by the engine to execute the final action.

Its role:

1. check parser errors
2. fallback to `help.show` if needed
3. retrieve corresponding action hook
4. execute the hook with proper context

The runner links:

* runtime resolution
* actual CLI execution

---

## Fallback Handling

The manager handles several fallback cases:

* parser errors → redirect to `help`
* missing hook → runtime error
* global overrides → redirect to built-in modules

These ensure robust and predictable CLI behavior.

---

## Rationale

`ModulesManager` transforms configuration into execution.

It marks a key transition:

* before → core builds runtime
* after → core delegates to business logic

Design principles:

* strict separation between parsing / resolution / execution
* full determinism
* strong typing
* extensibility via hooks
* controlled mutation at end of runtime

---

## Relationships

### With `GlobalsManager`

Globals may influence resolution (e.g., help/version).

---

### With `ParserManager`

Parser resolves:

* module
* action
* flags
* arguments

---

### With `RuntimeService`

Runtime is finalized at this stage.

---

### With the Engine

The engine calls the runner to execute the action.

---

### With `EventsManager`

Hooks can emit signals and messages.

---

## Current Limitations

In v0.1:

* fallback system is still evolving
* parser error handling is partially simplified
* help module is basic
* some runner behaviors are still being refined

---

## Future Evolutions

Planned improvements include:

* runner enhancements
* richer help module
* better parser error handling
* hook refinement
* improved runtime/business separation

---

## Conclusion

`ModulesManager` is the most structurally critical runtime component.

It transforms CLI input into actual execution, handling:

* execution modes
* module and action resolution
* fallback logic
* execution hooks

It marks the end of runtime construction and the beginning of business execution.

---
