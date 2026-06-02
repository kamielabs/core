# IDEA-0001 - Static Metadata i18n Layer

## Status

Draft

Post-v0.1 architectural idea.

Not validated.
No implementation decision taken yet.

---

## Problem

The current i18n system is entirely event-driven.

Runtime translations are resolved through declared events:

- event.name
- runtime emit
- event translation lookup
- CoreMessage rendering

This architecture works well for:

- diagnostics
- runtime messaging
- usage rendering
- warnings/errors/fatal
- observability

However, a structural limitation was identified:

```text
Core metadata cannot currently be translated.
````

Affected metadata includes:

- module descriptions
- action descriptions
- flag descriptions
- future static help/documentation metadata

These elements are static documentation data and are not runtime events.

---

## Current Situation

Current i18n flow:

```text
event
-> translation lookup
-> CoreMessage
```

The translation system is tightly coupled to runtime events.

This creates a problem for static metadata because:

- metadata should not emit runtime events
- metadata should not pollute observability
- metadata is not part of runtime live events
- metadata does not fit the event lifecycle

As a consequence:

```text
description: "..."
```

cannot currently be translated through the existing system.

---

## Initial Direction

The likely direction is to introduce a dedicated metadata translation lookup layer.

Important:

```text
This must NOT break or dilute the current event-driven i18n model.
```

The current runtime i18n architecture is considered correct and should remain focused on runtime messaging.

The idea is instead to complement it with a static translation resolver dedicated to metadata/help/documentation rendering.

Potential conceptual split:

```text
Runtime i18n:
event -> message

Static i18n:
key -> translated metadata
```

---

## Important Constraints

### Existing architecture is already highly stabilized

The following systems are now strongly structured:

- EventsManager
- runtime event pipeline
- snapshots
- help routing
- usage rendering
- indexes/canonical resolution
- parser/runtime separation

Large architectural modifications before v0.1 are considered risky.

---

### Developer experience must remain coherent

One major constraint:

```text
Avoid introducing two completely different translation declaration systems.
```

The following approach is currently considered undesirable:

```ts
description: {
 en: "...",
 fr: "..."
}
```

Reason:

- breaks centralized i18n philosophy
- creates declaration duplication
- complicates maintenance
- complicates tooling
- weakens fallback systems

The preferred direction is still key-based translation resolution.

---

### Metadata and events likely require separate stores

The current translation system validates translations against declared runtime events.

Metadata translations do not follow the same invariants:

- not runtime events
- not observable
- not lifecycle-driven
- potentially hierarchical/documentation-oriented

Because of this, metadata translations may require:

- a separate dictionary
- separate validation logic
- separate lookup APIs

while still sharing:

- locale handling
- fallback behavior
- loading mechanisms
- runtime context

---

## Open Questions

### API design

Possible future APIs:

```ts
eventTr(...)
metaTr(...)
```

or equivalent abstractions.

---

### Declaration model

How should metadata translation keys be declared?

Examples:

```ts
description: "help.modules.test.description"
```

or another model entirely.

---

### Storage architecture

Questions still unresolved:

- separate translation dictionaries?
- shared loader?
- shared runtime storage?
- shared validation?
- namespace strategy?
- snapshot exposure?

---

### Validation model

Current event translations are strictly validated against runtime event existence.

Metadata translations likely require a different validation strategy.

Needs future design clarification.

---

## Non-Goals (v0.1)

This idea is explicitly postponed after v0.1.

Current priorities remain:

- finalize builtin help rendering
- finalize TEST_PLAN
- stabilize runtime
- release first RC versions

No large i18n refactor should happen before the first stable delivery cycle.

---

## Notes

This issue revealed an important conceptual distinction:

```text
Runtime messaging != documentation metadata
```

The current architecture is not considered incorrect.

Instead, the current i18n model appears specialized for runtime/event-driven messaging, while static documentation/help metadata likely requires an additional complementary layer.
