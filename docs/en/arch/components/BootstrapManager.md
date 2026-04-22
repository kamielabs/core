# 🧱 BootstrapManager

## Description

`BootstrapManager` is the very first runtime manager executed by the core.

Its role is to capture the raw execution environment at CLI startup, then normalize it into an initial set of `RuntimeCoreFacts`.

It contains no business logic, no user hooks, and no declarative customization in v0.1.

Its sole purpose is to build a reliable technical foundation from the current shell and Node.js process.

---

## Purpose

`BootstrapManager` is responsible for producing the **initial runtime facts** from the real execution environment.

It mainly retrieves:

* the command line (`process.argv`)
* the current working directory (`process.cwd()`)
* the system environment (`process.env`)
* minimal information about the executed script

This step is fully automatic.

The goal is to ensure that from this point onward, the core operates on a consistent foundation, regardless of how the script was launched.

---

## Why This Manager Exists

The core needs a deterministic starting point before any further resolution.

Before dealing with:

* stages
* globals
* parser
* modules
* actions

it must first know **the actual context in which the CLI is running**.

`BootstrapManager` exists to isolate this responsibility early in the lifecycle:

* read the raw environment
* build a stable runtime object
* expose a predictable structure to the rest of the core

This prevents direct access to `process.argv`, `process.env`, or `process.cwd()` from being scattered across the system.

---

## Scope

In v0.1, `BootstrapManager` is intentionally minimal.

It:

* reads basic system information
* extracts facts about the current script
* stores raw environment variables
* initializes the first `RuntimeCoreFacts`

It does not:

* perform advanced multi-platform detection
* resolve shell-specific behavior
* transform environment variables in complex ways
* include user-specific logic
* allow customization via hooks

Its scope is strictly technical and foundational.

---

## What This Manager Produces (Resolved Runtime Facts)

The manager produces an initial runtime block including:

### Node executable

The Node binary used to run the script.

### Current working directory

The directory from which the CLI was executed.

### Script facts

Information about the current script:

* full command
* raw script path
* file name
* extension
* parent directory
* remaining arguments

### Environment variables

A raw copy of `process.env`, stored in `runtime.envs`.

---

## Internal Behavior

Resolution follows a simple flow:

1. emit an internal bootstrap initialization event
2. read the current execution environment
3. extract minimal script and shell information
4. build `RuntimeCoreFacts`
5. mark the manager as resolved

The manager depends on no prior runtime state.

That is why it is the very first concrete resolution step.

---

## Rationale

Bootstrap is separated from the rest of the runtime for a simple reason:

> the core must first observe the environment as-is before structuring it.

This separation keeps the design clean:

* `BootstrapManager` observes
* subsequent managers interpret, enrich, or project

It also improves future portability: system-level logic can evolve without impacting other core components, as long as the produced facts remain consistent.

---

## Relationships

### With `RuntimeService`

Facts produced by `BootstrapManager` form the foundation of the global runtime.

They are then injected into the overall runtime flow via subsequent services and managers.

---

### With `StagesManager`

Stages rely on the base context provided by bootstrap, including:

* current working directory
* system environment
* global execution context

---

### With the parser and other managers

The parser and other managers do not read directly from the shell or `process.*`.

They must rely on facts already constructed by the bootstrap.

This reinforces internal consistency.

---

### With `EventsManager`

The manager emits an internal event at the start of its resolution.

This allows tracing entry into the bootstrap phase from the very beginning of runtime.

---

## No Hooks / No Customization

In v0.1, `BootstrapManager` provides:

* no dedicated hooks
* no user overrides
* no specific declarative configuration

This is intentional.

Bootstrap must remain fully controlled by the core to ensure a simple, reliable, and deterministic runtime foundation.

---

## Current Limitations

In v0.1, the implementation is intentionally minimal.

Known limitations:

* effectively limited to Linux support
* behavior designed around a Bash-like environment
* no explicit platform selection
* no fine-grained shell handling
* very basic script information extraction

This first version prioritizes clarity and stability of the runtime contract.

---

## Future Evolutions

Planned improvements include:

* automatic platform detection
* support for multiple environments:

  * Linux
  * Windows
  * Darwin
* dedicated loaders/resolvers per platform
* shell-level resolution based on detected environment
* consistent runtime facts regardless of platform

The long-term goal is clear:

> provide identical `RuntimeCoreFacts`, regardless of the originating environment.

In other words, bootstrap must absorb system differences to expose a unified foundation to the rest of the core.

---

## Conclusion

`BootstrapManager` is the technical entry point of the runtime.

It makes no decisions, performs no functional interpretation, and exposes no user customization.

It does one thing—and must do it perfectly:

> capture the real execution environment and transform it into reliable, consistent base runtime facts.

This neutrality is what makes it a fundamental building block of the lifecycle.

---
