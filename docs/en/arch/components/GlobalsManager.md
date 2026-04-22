# 🧱 GlobalsManager

## Description

`GlobalsManager` is the runtime manager responsible for resolving **global CLI options**.

It runs after `StagesManager`, once:

* the active stage has been resolved
* i18n has been initialized
* the parser has been prepared for further resolution

Its role is to produce `RuntimeGlobalsFacts` from multiple value sources, following a strict priority order.

Global options have a specific nature in the core: they are both:

* tied to environment variables
* exposed as CLI flags

They act as a bridge between persistent configuration, system environment, and command line input.

---

## Purpose

`GlobalsManager` resolves all **global CLI flags** and stabilizes their final runtime values.

It answers cross-cutting concerns of the CLI before module, action, or argument resolution.

Its goal is to provide a single, coherent, and typed global block, used by the rest of the runtime as the source of truth for global options.

---

## Why This Manager Exists

Global options occupy a unique place in the core.

They are neither simple stage options nor module/action flags.

They define a transversal layer of the CLI, usable regardless of the functional context.

`GlobalsManager` exists to isolate this responsibility in a dedicated phase.

It centralizes:

* resolution of global environment variables
* optional loading of stage environment files
* integration of CLI global flag overrides
* exposure of final global values to the runtime

This avoids scattering global resolution logic across the core.

---

## Scope

In v0.1, `GlobalsManager` is responsible for:

* validating global environment variable consistency
* building resolution indexes
* instructing the parser to resolve global flags
* resolving final global option values
* executing an optional global hook
* producing `RuntimeGlobalsFacts`

It does not:

* resolve stages
* initialize i18n
* initialize the parser
* resolve modules or actions
* implement business logic

Its scope is focused on **runtime global options**.

---

## Special Nature of Global Options

Global options are structured into **groups**.

Each global option:

* belongs to a group
* references an environment variable
* may expose zero, one, or multiple CLI flags

All flags associated with a given option affect the **same final value**.

In other words, flags do not create separate options—they are multiple CLI entry points to the same runtime value.

This structure enables:

* clearer organization
* simpler resolution
* cleaner typing
* better extensibility

---

## Value Resolution Order

Global options follow a strict override order:

* default value
* stage environment file value
* runtime environment variable value
* CLI global flag value

In other words:

> `default < ENV file < ENV var < CLI flag`

This order is deterministic and defines global resolution in the core.

The parser only operates on the last layer (CLI flags).

ENV file and ENV variable layers are resolved beforehand.

---

## Prerequisites

Before `GlobalsManager` runs, some components are already initialized.

After stage resolution, `RuntimeService` automatically triggers:

* i18n resolution
* parser initialization

This implies:

* the global context can already emit `message()` (i18n is available)
* the parser is ready to resolve global flags in the correct phase

`GlobalsManager` operates within an already partially structured runtime.

---

## What This Manager Produces

The manager produces a `RuntimeGlobalsFacts` block.

This block contains final values of all global options, structured as declared.

Each value is fully resolved and stable according to the priority order.

It becomes the runtime source of truth for global options.

---

## Internal Behavior

Resolution follows a clear sequence:

1. validate collisions between stage and global environment variables
2. load known environment variables
3. load the stage environment file
4. determine next parser phase
5. instruct the parser to resolve global flags
6. resolve all global values based on priority
7. store results in a runtime draft
8. emit global hook event
9. execute optional global hook
10. freeze the dictionary
11. mark manager as resolved

The result is injected into runtime as global facts.

---

## Internal Validation

Before resolution, the manager performs minimal validation.

In v0.1, it mainly ensures no collision exists between global and stage environment variables.

This preserves separation between:

* stage environment variables
* global environment variables

Avoiding ambiguity in runtime resolution.

---

## Internal Indexes

Indexes are built at initialization.

They are used to:

* map environment variables to global options
* map CLI flags to global options
* guarantee uniqueness of runtime global keys

### Environment Variable Index

Maps each global environment variable to its group and option.

---

### CLI Flag Index

Maps each flag to its group, option, and CLI definition.

Supports:

* long flags
* short flags
* aliases

Indexes do not resolve values—they enable fast and deterministic resolution.

---

## Relationship with the Parser

`GlobalsManager` does not parse CLI input itself.

It delegates parsing to `ParserManager`.

The parser receives global flag indexes and resolves only this phase of the CLI.

This ensures separation between:

* CLI syntax resolution
* runtime value resolution

In practice:

* parser handles flags
* `GlobalsManager` defines final runtime truth

---

## Hooks and Customization

`GlobalsManager` exposes a single global hook.

It runs after:

* global values are resolved
* hook event is emitted

It allows controlled interaction with resolved globals.

Since i18n is available, the hook context is richer than earlier phases.

---

## Hook Context

The hook receives a structured context:

### `options`

Resolved global options (typed runtime values).

---

### `runtime`

Read-only view of known runtime state:

* bootstrap
* stage
* current global context

---

### `snapshot`

Fully typed initialization dictionary.

---

### `tools`

Core tools available at this phase.

In v0.1, includes:

* `signal()`
* `message()`
* `setListener()`

---

## Global Hook Characteristics

The global hook enables more advanced integration than stage hooks.

Typical uses:

* emitting internal signals
* emitting localized messages (i18n available)
* registering runtime listeners
* connecting transversal runtime behaviors

Global options often configure CLI behavior—not just values.

The hook bridges resolved values and their runtime effects.

---

## Global Hook Limitations

Like all core hooks, it is not a free mutation point.

It can:

* read resolved globals
* use core tools
* attach controlled runtime behaviors

It must not:

* break resolution invariants
* mutate manager facts arbitrarily
* bypass typed structure

Principle remains:

> the hook complements resolution, it does not replace the manager.

---

## Rationale

`GlobalsManager` centralizes a runtime layer often scattered in other CLI systems.

Here, globals are explicit, with:

* dedicated declarative structure
* dedicated indexing system
* strict priority order
* dedicated hook point

Benefits:

* improved runtime clarity
* deterministic behavior
* clear separation of concerns
* stronger typing
* clean integration with parser

It prevents “global logic” from leaking into other layers.

---

## Relationships

### With `StagesManager`

Depends on resolved stage:

* stage environment file
* stage name
* validated stage runtime data

---

### With `RuntimeService`

Global facts are injected into runtime and used in later phases.

Hook runtime context is also provided by core services.

---

### With `I18nManager`

Since i18n is resolved, `message()` is available.

This differentiates it from earlier phases.

---

### With `ParserManager`

Relies on parser for CLI flag resolution.

Provides indexes and consumes parsed results.

---

### With Subsequent Managers

Other managers must not re-resolve globals.

They rely on `RuntimeGlobalsFacts` as the single source of truth.

---

### With `EventsManager`

Emits internal events during resolution, especially for hooking phase.

Some validations still use `throw` in v0.1, but are expected to evolve toward event-based handling.

---

## Current Limitations

In v0.1:

* some validations still use exceptions
* error reporting is not fully event-driven yet
* only one global hook
* validation remains minimal
* hook lifecycle may evolve

These are expected limitations for a first stable release.

---

## Future Evolutions

Planned improvements include:

* removing remaining `throw` in favor of event-based errors
* enhancing global validation
* improving global hook system if needed
* refining runtime listener model
* improving consistency between parser, globals, and runtime

The goal is to maintain a manager that is:

* strict
* readable
* deterministic
* strongly typed
* flexible enough for advanced global behaviors

---

## Conclusion

`GlobalsManager` is responsible for resolving everything **global to the CLI**.

It transforms structured declarations into a single, stable runtime block used across the core.

Its role goes beyond value resolution:

it organizes a transversal CLI layer, connects it to the parser, and enables richer integration via i18n-enabled hooks.

This intermediate position—between configuration, parsing, and runtime integration—makes it a key lifecycle component.

---
