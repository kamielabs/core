# 🧱 RuntimeService

## Description

`RuntimeService` is the service responsible for global runtime management.

It acts as:

* execution phase orchestrator
* guarantor of resolution order
* container of the global runtime
* runtime access point for hooks

It centralizes runtime state and ensures its consistency throughout the lifecycle.

---

## Purpose

`RuntimeService` has three main objectives:

* enforce a strict runtime execution order
* provide a consistent runtime accessible to hooks
* isolate runtime mutations from manager internal data

Its role can be summarized simply:

> orchestrate, secure, and expose the runtime.

---

## Why This Service Exists

The core relies on several independent managers:

* bootstrap
* stages
* i18n
* globals
* modules

But without central coordination:

* execution order could become inconsistent
* data could be accessed too early
* mutations could directly impact managers

`RuntimeService` exists to:

* enforce a strict execution sequence
* centralize runtime data
* guarantee system integrity

---

## 🔒 Runtime Nature

The runtime follows a strict model:

* linear execution
* deterministic transitions
* irreversible progression

Once a phase is validated:

* it cannot be replayed
* it cannot be rolled back
* it cannot be modified

> the runtime always moves forward to the final state (`ready`), with no backward transitions.

This design ensures:

* simplicity
* predictability
* easier debugging

---

## Runtime Orchestration

The runtime is built step by step via explicit methods:

```ts
setInit()
setBootstrap()
setStage()
setGlobals()
setAction()
setReady()
````

Each step:

* triggers a manager resolution
* updates internal state
* enriches the global runtime
* emits events

---

## Execution Order

The runtime follows a strict sequence:

```text id="b8f3jp"
init → bootstrap → stage → i18n → globals → module → ready
```

Transitions are controlled internally:

```ts
_runtimeTransitions
```

Any invalid transition triggers an error:

```ts
INVALID_RUNTIME_TRANSITION
```

---

## State Management

The service maintains a current state:

```ts
_runtimeState
```

And exposes:

* `getState()` → current state
* `isState()` → state check

This allows:

* tracking runtime progression
* securing transitions
* simplifying debugging

---

## Runtime Construction

The runtime is progressively built into a `_draft` object:

```ts
this._draft.bootstrap = ...
this._draft.stage = ...
this._draft.globals = ...
this._draft.module = ...
```

Then frozen at the end:

```ts
this.setResolved(this._draft);
```

---

## Controlled Mutation

A key principle:

> hooks never modify managers.

Mutations occur via:

* the global runtime (`_draft`)
* controlled tools

This ensures:

* manager data integrity
* clear separation between declaration and execution
* traceable modifications

---

## Relationship with Hooks

`RuntimeService` provides context adapted to each phase.

---

### Stage

```ts
stageContext()
```

Contains:

* `bootstrap`
* `stage` (draft)

---

### Globals

```ts
globalsContext()
```

Contains:

* `bootstrap`
* `stage`
* `globals` (draft)

---

### Module

```ts
moduleContext()
```

Contains:

* `bootstrap`
* `stage`
* `globals`
* `module` (draft)

---

### Action

```ts
actionContext()
```

Contains:

* full and frozen runtime

---

## Role in i18n and Parser

`RuntimeService` implicitly triggers:

* `I18nManager` resolution after stages
* parser initialization

Engines are unaware of these steps.

This ensures:

> all orchestration logic is centralized in one place.

---

## Relationship with Engines

Engines must:

* call `set*()` methods in order
* never rebuild runtime themselves

`RuntimeService` enforces a strict contract:

> the engine orchestrates, but does not define runtime.

---

## Events

Each step emits events:

* `runtimeInit`
* `bootstrapInit` / `bootstrapReady`
* `stageInit` / `stageReady`
* `globalsInit` / `globalsReady`
* `actionInit` / `actionReady`
* `runtimeReady`

This enables:

* full lifecycle tracking
* event-driven orchestration (FedEngine)
* complete observability

---

## Separation from Managers

Managers:

* produce data
* handle their own resolution

`RuntimeService`:

* orchestrates execution
* aggregates results
* exposes a unified view

This separation is essential.

---

## Rationale

The design is based on a strong idea:

> a runtime must be built, not improvised.

This implies:

* strict sequencing
* controlled state
* limited mutation
* clear separation of concerns

`RuntimeService` enforces these rules.

---

## Relationships

### With Managers

It calls:

* `bootstrap.resolve()`
* `stages.resolve()`
* `i18n.resolve()`
* `globals.resolve()`
* `modules.resolve()`

---

### With `EventsManager`

It emits all lifecycle events.

---

### With `ToolsService`

Tools indirectly mutate runtime via this service.

---

### With Hooks

It provides runtime contexts at each phase.

---

### With Engines

It enforces execution flow.

---

## Current Limitations

In v0.1:

* orchestration remains simple
* no advanced error control
* fixed transitions
* no rollback support

These are intentional for simplicity and determinism.

---

## Future Evolutions

Possible improvements include:

* runtime instrumentation
* advanced runtime debugging
* additional internal hooks

---

## Conclusion

`RuntimeService` is the backbone of the core.

It does not implement business logic, but ensures everything else runs correctly.

> it does not do the work… but ensures the work is done in the right order, at the right time, and in the right way.

This rigor makes the core:

* predictable
* extensible
* robust

---
