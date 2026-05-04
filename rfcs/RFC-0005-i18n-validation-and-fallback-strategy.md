# 📄 RFC-0005 — I18n Validation & Fallback Strategy (Updated)

## Status

Proposed (Post v0.1)

---

## Dependencies

This RFC depends on:

* RFC-0002-builtins-customs-merge-removal

Builtins and custom i18n systems MUST be separated before applying this RFC.

---

## Context

The current i18n system operates in a **lazy runtime mode**:

* messages are resolved at call time via `tr()`
* missing messages trigger warnings dynamically
* resolution is event-driven

The system previously relied on a **reference language (`en`)**, which introduced unnecessary coupling.

---

## Problem

### 1. Language as Source of Truth

Using a reference language:

* couples the system to a specific language
* makes validation indirect
* prevents full decoupling between core and custom logic

---

### 2. Incomplete Observability

Warnings are only emitted when:

* a message is requested
* and depending on log level

This can lead to:

* silent missing translations
* partial validation coverage

---

### 3. Mixed Responsibilities (Core vs Custom)

Currently:

* core and custom i18n behaviors are not fully separated
* validation and resolution rules are not clearly scoped

---

## Goals

* Use **event.name as the single source of truth**
* Fully decouple i18n from language structure
* Strictly separate core and custom i18n systems
* Keep runtime lazy resolution
* Provide predictable and explicit behavior
* Avoid hidden fallback logic
* Keep the system simple and extensible

---

## Proposal

### 1. Event Name as Source of Truth

Each message is resolved using:

```txt
event.name
```

Event names act as the universal identifier for translations.

---

### 2. Resolution Strategy

At runtime:

```txt
1. lookup in selected language
2. fallback to event.name
```

There is:

* no fallback language
* no implicit language chaining
* no dependency between languages

This guarantees deterministic and transparent behavior.

---

### 3. Core vs Custom Separation

#### Core I18n (Builtins)

* strict validation
* translations must match all builtin message events
* fully controlled by the core
* warnings always enabled

#### Custom I18n

* fully independent from core
* no strict validation
* translations are optional
* developers are responsible for consistency

---

### 4. Validation Phase

Validation is performed during i18n initialization.

#### Core (Builtins)

```txt
✔ all message event.name keys must be present
✔ no unknown keys
✔ values must be valid
```

#### Custom

```txt
✔ no strict validation
✔ optional runtime warnings only
```

Validation is:

* deterministic
* separated between core and custom systems
* not blocking for custom events

---

### 5. Validation Events

Validation results are emitted as events:

```txt
CORE_I18N_MISSING_KEYS → warning
CORE_I18N_UNKNOWN_KEYS → warning/error
CORE_I18N_INVALID_VALUES → warning
```

---

### 6. Runtime Behavior

`tr()` remains:

* lazy
* synchronous in behavior (no async side-effects)
* event-driven
* always deterministic

If no translation is found:

```txt
→ event.name is returned
```

---

### 7. Warning Strategy

To avoid log flooding:

* warnings SHOULD be emitted once per `(event.name, language)` pair

Warnings can be controlled via configuration:

```ts
skipI18nWarnings: boolean // default: false
```

When enabled:

* no i18n warnings are emitted for custom events
* core warnings may remain active (implementation-defined)

Warnings should include clear guidance:

```txt
[i18n] Missing translation for "EVENT_NAME" in "lang"
You can disable this with "skipI18nWarnings: true"
```

---

## Design Constraints

* No runtime performance overhead
* No async resolution complexity
* No dependency on a reference language
* No implicit fallback behavior
* Clear separation between core and custom systems

---

## Non-Goals

* Forcing full translation coverage for custom events
* Blocking execution on missing translations
* Introducing complex fallback chains
* Changing event system behavior

---

## Risks

* Developers may ignore translation consistency
* Potential confusion when fallback returns event.name
* Increased responsibility on developers for custom i18n

---

## Mitigations

* Emit clear and actionable warnings
* Allow disabling warnings explicitly
* Document behavior clearly
* Keep fallback logic simple and predictable

---

## Migration Plan

1. Separate builtins and custom i18n systems
2. Remove reference language dependency (`en`)
3. Replace fallback language resolution with `event.name`
4. Update all references from `event.code` to `event.name`
5. Implement validation phase in I18nManager
6. Introduce `skipI18nWarnings` configuration
7. Keep runtime resolution simple and unchanged in behavior

---

## Conclusion

This RFC removes the last strong coupling in the i18n system:

→ language as a reference

and replaces it with:

→ event.name as a universal source of truth

This ensures:

* full decoupling
* predictable runtime behavior
* improved developer control
* better long-term scalability

---
