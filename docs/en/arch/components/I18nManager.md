# 🧱 I18nManager

## Description

`I18nManager` is the runtime manager responsible for resolving and exposing the core’s internal translation system.

It becomes usable only once the language has been resolved and fixed by `StagesManager`.

Its initialization is automatically triggered by `RuntimeService`, right after stage resolution.  
Like the parser, engines have no direct knowledge of this component.

Its role is to:

* load declared translations
* build internal resolution indexes
* select the active language
* define a fallback language
* expose a translation method usable by the rest of the core

---

## Purpose

`I18nManager` provides a simple, stable internal translation system directly usable by core tools.

It allows to:

* emit localized messages
* fallback cleanly to a reference language
* inject dynamic values into messages
* detect certain translation inconsistencies

Its goal is to ensure that once the runtime language is known, core messages can be reliably resolved.

---

## Why This Manager Exists

The core must not depend on an external system to translate its own messages.

It needs an internal component capable of:

* centralizing translations
* providing uniform message access
* handling fallback
* reporting known inconsistencies

`I18nManager` isolates this responsibility into a dedicated, easy-to-reason-about runtime layer.

It also connects:

* the language resolved by the stage
* `message` events
* tools exposed to hooks and runtime

---

## Scope

In v0.1, `I18nManager` is responsible for:

* building translation indexes
* selecting the active language
* defining `en` as fallback
* checking structural inconsistencies across languages
* exposing the `tr()` method
* injecting dynamic values into messages
* reporting certain issues via internal events

It does not:

* strictly validate translations against declared message events
* strongly bind message definitions to translation dictionaries
* implement business logic
* allow hook-based customization

Its scope remains intentionally simple and focused on core translation.

---

## Prerequisites

`I18nManager` can only be resolved once the runtime language is known.

This language is defined at stage level and fixed before initialization.

It depends on:

* `StagesManager` for `lang`
* `RuntimeService` for proper orchestration

Engines never interact with it directly.

---

## Source of Truth

In v0.1, the system relies on a single source of truth: the `en` language.

Meaning:

* all keys in `en` define the reference
* other languages must align with these keys
* fallback always targets `en`

This approach is intentionally simple.

It avoids tightly coupling message event definitions with translation dictionaries in the first version.

---

## Consequences of This Design

This choice leads to several behaviors:

* a language can be incomplete without breaking runtime
* missing keys fallback to `en`
* missing keys in `en` cannot be resolved
* unknown keys outside `en` are considered structural inconsistencies

This last case is critical:

unknown keys cannot be reliably mapped to the core reference, so no fallback is possible.

In this design, it is a blocking condition.

---

## Resolution Flow

Resolution follows a simple sequence:

1. emit i18n initialization event
2. retrieve runtime language from stage
3. define `en` as fallback
4. ensure `en` exists
5. compare all languages against `en`
6. build runtime i18n facts
7. freeze dictionary
8. mark manager as resolved
9. emit `i18nReady` event

---

## What This Manager Produces

The manager produces `RuntimeI18nFacts`, including:

* `lang`: active language
* `fallback`: fallback language
* `index`: messages for active language
* `fallbackIndex`: messages for fallback language

These facts are then used to resolve all core messages.

---

## Internal Indexes

Two main indexes are built:

### Language Index

Allows retrieving messages by:

* language
* code

---

### Code Index

Allows retrieving the same message code across languages.

Indexes are built once at initialization and then frozen.

---

## Structural Validation

In v0.1, validation is simple but useful, based on `en`.

For each language other than `en`:

### Missing Keys

Keys present in `en` but missing in the current language.

* runtime continues
* fallback applies
* internal event is emitted

---

### Unknown Keys

Keys present in the current language but absent from `en`.

* considered a structural inconsistency
* error event is emitted
* no reliable fallback possible

This behavior is intentional and aligned with the design.

---

## Fallback

Fallback is central to the manager.

When a message is missing in the active language:

* the manager attempts to resolve it in `en`
* if found, it is used
* an internal event signals fallback usage

If missing in `en`, the system considers the reference incomplete.

---

## Translation Method

The manager exposes `tr()` as the translation interface.

It:

* ensures the manager is resolved
* looks up the message in active language
* falls back to `en` if needed
* injects dynamic values
* returns a consumable message

It may return:

* simple content (`content`)
* full message (`title` + `description`)

---

## Value Injection

Dynamic value injection is supported.

Placeholders are replaced using a provided dictionary:

* `{name}`
* `{path}`
* `{lang}`

If a value is missing:

* an internal event is emitted
* placeholder remains unchanged

This preserves readability while exposing the issue.

---

## Error Handling

The manager follows a fallback-first strategy, except for structural issues.

In practice:

* missing language → fallback
* missing message in active language → fallback
* missing injection value → warning, continue
* missing message in `en` → strong structural error
* unknown key outside `en` → blocking inconsistency

In short:

> as long as a reliable fallback exists, runtime continues; if the reference itself is inconsistent, execution must stop.

---

## Rationale

The design is pragmatic.

It solves a simple need:

* core must translate its own messages
* without heavy architecture
* while remaining deterministic

Using `en` as source of truth is simple, effective, and sufficient for v0.1.

It is not the final ideal design, but it is stable and easy to evolve.

---

## Relationships

### With `StagesManager`

Depends on stage for runtime language.

Without stage resolution, i18n cannot initialize.

---

### With `RuntimeService`

Initialization is automatically orchestrated.

Engines remain unaware of it.

---

### With `EventsManager`

Emits internal events during resolution and usage:

* initialization
* fallback usage
* missing keys
* unknown keys
* missing injection values
* fatal i18n
* i18n ready

---

### With Core Tools

Once resolved, tools like `message()` become available.

---

### With Other Managers

Other managers do not manipulate translation structures directly.

They consume translations via tools or resolved messages.

---

## Current Limitations

In v0.1:

* `en` is the only source of truth
* no formal link between message events and translation dictionaries
* validation is structural, not contractual
* missing keys are tolerated via fallback (if `en` is valid)
* no i18n hooks or customization

Future evolution will focus on stronger linkage between:

* message events
* expected translations across all languages

---

## Future Evolutions

Planned improvements include:

* stronger coupling between events and translations
* stricter global validation
* better guarantees across builtins, customs, and language dictionaries
* refined i18n diagnostics

The goal is to evolve toward a stronger contract without losing simplicity.

---

## Conclusion

`I18nManager` is the runtime component that makes core messages usable in the active language.

It follows a simple rule:

> `en` defines the reference, other languages align, and fallback applies as long as the reference remains consistent.

This pragmatic approach provides a reliable, easy-to-reason-about i18n system in v0.1, strict enough to block truly dangerous inconsistencies.

---
