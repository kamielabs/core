# 🧱 StagesManager

## Description

`StagesManager` is the second runtime manager executed by the core, right after `BootstrapManager`.

Its role is to resolve the **active stage** of the CLI, load its persistent configuration, extract runtime options, and produce `RuntimeStageFacts`.

It represents the first structured configuration layer of the runtime.

In v0.1, it mainly defines:

* the stage environment file
* the language used by i18n
* custom stage options

This resolution is deterministic and follows a strict priority order between default values, file values, and environment variables.

---

## Purpose

`StagesManager` transforms a raw execution context into a **resolved stage context**.

It answers key questions early in the runtime:

* which stage is the CLI running in?
* which environment file should be loaded?
* which language should be used?
* which stage options are active at runtime?
* which runtime customizations should be applied before further resolution?

Its goal is to produce a stable, readable, and typed configuration layer for the rest of the runtime.

---

## Why This Manager Exists

Bootstrap only captures the raw execution environment.

That is not enough to properly drive a serious CLI.

Before resolving globals, parsing, modules, or actions, the core must know **in which logical execution mode it operates**.

`StagesManager` introduces this structured layer.

It allows to:

* select the active stage
* load the associated environment file
* resolve stage options
* execute an optional stage hook
* produce consistent stage facts

In practice, it enables clean separation of CLI usage contexts, such as:

* development
* production
* sandbox
* local environments
* custom developer-defined modes

---

## Scope

In v0.1, `StagesManager` is responsible for:

* determining the active stage
* loading the stage environment file
* resolving stage options
* applying builtin overrides for the default stage
* executing minimal internal validation
* executing optional user hooks
* producing `RuntimeStageFacts`

It does not:

* implement business logic
* allow free mutation of resolved facts
* handle advanced multi-platform resolution
* manage complex path logic beyond current behavior
* resolve the full runtime alone

Its scope is focused on **runtime environment configuration**.

---

## Role of Stages

Stages define different execution contexts for a CLI.

The core provides a mandatory builtin stage used as a base to resolve:

* persistent configuration file
* language
* standard stage options

This default stage may remain invisible in simple use cases, but it is still a fundamental runtime component.

Developers can:

* rename it
* partially override it
* define additional custom stages

The goal is to adapt CLI behavior depending on execution context.

Example:

* a `dev` stage may enable sandboxing or a custom working directory
* a `prod` stage may use a different environment file and disable such logic

---

## Active Stage Selection

The active stage is determined via:

`_NODE_CLI_STAGE`

Behavior:

* if missing or empty → default stage is used
* if matching default stage → builtin stage is used
* otherwise → core resolves the corresponding stage

This variable can be injected by build or execution tools.

This allows clean integration with external workflows while preserving determinism.

---

## Resolution Priority

Stage options follow a strict override order:

* default value
* core builtin override
* stage environment file
* inline environment variables

In other words:

> `default < builtin override < ENV file < ENV inline`

This guarantees predictable final values.

---

## What This Manager Produces

`RuntimeStageFacts` includes:

### Active stage name

The resolved stage name.

### Environment file

Path to the stage environment file.

### Resolved options

All stage options after applying priority rules.

Values are fully resolved and typed.

---

## Internal Behavior

Resolution follows:

1. determine active stage name
2. validate stage existence
3. validate environment file presence
4. load environment file
5. resolve options by priority
6. build draft `RuntimeStageFacts`
7. apply builtin overrides
8. emit stage hook event
9. run internal validation
10. execute optional user hook
11. freeze result
12. mark as resolved

---

## Internal Validation

Before user hooks, minimal validation is applied:

* `lang` must be defined and non-empty
* `workingDir` must exist if defined

This ensures core invariants are respected early.

---

## Hooks and Customization

`StagesManager` is the first manager to support hooking.

Hooks can be registered for:

* default builtin stage
* custom stages

They execute **after resolution** and **after validation**.

They allow controlled runtime adjustments such as:

* sandbox management
* adjusting working directory via tools
* emitting signals
* adding stage-specific logic

---

## Hook Context

Hooks receive:

### `options`

Resolved stage options (final values).

### `runtime`

Read-only runtime view (bootstrap + stage).

### `snapshot`

Full typed declaration dictionary.

### `tools`

Available tools (v0.1):

* `setCwd()`
* `signal()`

---

## Hook Limitations

Stage hooks are not free mutation points.

They can:

* read resolved values
* use provided tools
* influence runtime via controlled APIs

They cannot:

* directly mutate manager facts
* override resolved values freely
* bypass core invariants

> hooks act around the runtime, not against the manager resolution.

---

## Rationale

`StagesManager` separates:

* raw environment (bootstrap)
* logical configured environment (runtime)

Without it, configuration would be scattered across the system.

This ensures:

* clarity
* testability
* typing
* determinism

Hooks are executed only after resolution to guarantee stable inputs.

---

## Relationships

### With `BootstrapManager`

Runs immediately after bootstrap.

Uses execution context and environment variables.

---

### With `RuntimeService`

Injects stage facts into runtime.

Hooks can use runtime tools for controlled mutations.

---

### With `I18nManager`

Stage defines language → critical for i18n initialization.

---

### With Other Managers

Other managers must rely on `RuntimeStageFacts` instead of re-reading environment.

---

### With `EventsManager`

Emits events for:

* hook entry
* language errors
* working directory errors
* missing stage
* missing environment file

---

## Internal Indexes

Built at initialization:

* stage lookup by name
* environment variable mapping
* uniqueness guarantees

These enable fast and deterministic resolution.

---

## Current Limitations

In v0.1:

* direct `fs` usage remains
* limited path normalization
* basic handling of relative paths and `~`
* partial coupling with hook state
* minimal working directory validation
* default stage naming still partially fixed

---

## Future Evolutions

Planned improvements:

* abstract filesystem access
* better path normalization and validation
* cleaner builtin detection
* configurable default stage name
* debug tracing for option resolution
* possible internal refactor of `resolve()`

Long-term goal:

* strict
* deterministic
* typed
* extensible
* no implicit logic

---

## Conclusion

`StagesManager` is the first true runtime configuration layer.

Where `BootstrapManager` observes, `StagesManager` structures.

It resolves the active stage, loads its environment, stabilizes options, applies validation, and opens a controlled extension point.

This balance between strict resolution and controlled customization makes it a key lifecycle component.

---
