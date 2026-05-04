# RFC — Removal of Builtin/Custom Merge and Full Event-Driven Validation

## Status

Proposed (Post v0.1)

---

## Context

The current architecture relies on merging built-in and custom declarations during the `CLI.init()` phase.

This applies to multiple domains:

* events
* stages
* globals
* modules
* translations

This merge introduces a structural limitation:

* collisions must be detected **before runtime**
* therefore, validation must occur in builders
* and since `EventsManager` is not yet initialized, these validations rely on **CoreError**

---

## Problem

The merge strategy creates a split validation model:

* **Pre-runtime validation** (builders) → CoreError
* **Runtime validation** (managers) → Events

This leads to:

* duplication of validation logic
* inability to fully rely on the event system
* reduced observability during initialization
* structural coupling between data merging and validation

Additionally, merging introduces destructive behavior:

* silent overrides if not properly checked
* loss of original declaration intent
* complexity in ensuring uniqueness (keys, names, codes)

---

## Goals

* Eliminate structural dependency on merge operations
* Enable **full event-driven validation**
* Remove most CoreError usage outside of strict pre-runtime boundaries
* Improve observability and consistency of the core system
* Simplify validation logic across managers

---

## Proposal

### 1. Remove Builtin/Custom Merge

Instead of merging declarations:

```txt
current:
builtins + custom → merged dict
```

Use:

```txt
future:
builtins dict (immutable)
custom dict (immutable)
→ resolved at runtime
```

Each manager will:

* keep both dictionaries separate
* resolve them during its `resolve()` phase
* emit events for any conflict or invalid state

---

### 2. Move Validation to Managers

All validation currently performed in builders should be moved to managers:

```txt
before:
builder → validate → throw CoreError

after:
manager.resolve() → validate → emit events
```

---

### 3. Restrict CoreError Scope

CoreError will be limited to:

#### Pre-runtime only

* `cliCreator()` validation
* CLI instantiation errors (e.g. duplicate instance)
* EventsManager initialization (self-validation)

All other validation must be handled through events.

---

### 4. Event-Based Validation Model

All validation becomes observable:

```txt
- signal → structural issues without i18n
- message → user-facing issues with i18n
- error/fatal → terminate execution flow
```

---

## Benefits

* Full consistency: single validation system (events)
* Improved observability (everything goes through EventsManager)
* No destructive merge behavior
* Clear separation of concerns:

  * declaration vs resolution
* Better extensibility for plugins and future systems (Kloud)

---

## Trade-offs

* Requires refactoring of all builders and managers
* Impacts core initialization flow
* Requires re-validation of all existing logic
* Temporary coexistence of CoreError and events during transition

---

## Migration Plan (Post v0.1)

1. Introduce dual-dict model (builtins + custom)
2. Update managers to resolve without merge
3. Move validation logic from builders to managers
4. Replace CoreError with events where applicable
5. Remove merge-based builders
6. Update documentation and invariants
7. Validate with full test plan

---

## Notes

* This RFC does **not** apply to v0.1
* Current CoreError usage in builders is considered acceptable and necessary
* Asterisk notation in documentation marks CoreError entries that will be migrated

---

## Conclusion

The current merge-based architecture introduces unavoidable limitations in validation and observability.

Removing the merge mechanism enables a cleaner, more consistent, and fully event-driven core system.

This change is a structural evolution and should be implemented in a future major version.
