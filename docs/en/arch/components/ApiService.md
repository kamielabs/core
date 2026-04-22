# 🧱 ApiService

## Description

`ApiService` is the service that exposes the core developer API.

It acts as the official façade for declaring hooks and interacting with the runtime in a controlled way.

In practice, it is directly used behind:

```ts
cli.hooks(...)
````

Its role is to provide a clear, typed, and stable interface to:

* register hooks
* interact with certain core components
* configure some runtime behaviors

It contains no business logic: it fully delegates to managers.

---

## Purpose

`ApiService` exists to expose a clean and controlled API for developers using the core.

It allows to:

* hide internal manager complexity
* guarantee a single entry point for hooks
* enforce strict typing for interactions
* prevent direct access to internal core components

Its goal is simple:

> provide an ergonomic API without compromising core invariants.

---

## Why This Service Exists

Core managers are powerful, but:

* complex
* strongly typed
* sensitive to internal invariants

Exposing them directly would be risky:

* potential runtime breakage
* non-deterministic behavior
* loss of architectural control

`ApiService` exists as an **abstraction layer**:

* it exposes only what is allowed
* it controls entry points
* it maintains system consistency

---

## Scope

In v0.1, `ApiService` is responsible for:

* exposing hook registration methods
* redirecting calls to the appropriate managers
* maintaining strict typing for interactions
* serving as the single entry point for hooks

It does not:

* implement business logic
* perform runtime resolution
* transform data
* perform advanced validation
* manage state

It acts purely as a controlled proxy.

---

## How It Works

Each method exposed by `ApiService` directly maps to a manager capability.

The service:

1. receives a developer call
2. applies the expected typing
3. immediately delegates to the appropriate manager

Typical example:

```ts
api.onModule("user", hook)
```

→ redirected to:

```ts
ctx.modules.registerCustomModuleHook(...)
```

This design ensures:

* no logic duplication
* controlled API surface
* clear separation between public API and internal implementation

---

## Exposed Hooks

`ApiService` exposes several hooking methods.

---

### Stages

#### Built-in stage defaults override

Allows overriding some default values of the built-in stage.

```ts
setBuiltinStageDefaults(...)
```

---

#### Built-in stage hook

```ts
onBuiltinStage(stage, hook)
```

---

#### Custom stage hook

```ts
onCustomStage(stage, hook)
```

---

### Globals

#### Global hook

```ts
onGlobals(hook)
```

Allows interaction with resolved globals.

---

### Modules

#### Module hook

```ts
onModule(module, hook)
```

Allows interaction with module options.

---

#### Action hook

```ts
onModuleAction(module, action, hook)
```

Defines the actual execution of an action.

This is the main entry point for business logic.

---

## Typing

The service is strongly typed using core generics.

This allows:

* strictly typed hooks based on the targeted module/action
* consistency between declaration and runtime
* early error detection at compile time

Typing is one of the key strengths of this API.

---

## Relationship with `cli.hooks()`

`ApiService` is the technical layer behind the developer-facing method.

In other words:

```ts
cli.hooks().onModule(...)
```

The developer accesses `ApiService` via `cli.hooks()`, which returns a controlled interface exposing only allowed methods.

This ensures:

* limited API exposure
* controlled execution timing
* hooks are declared at the correct lifecycle moment

---

## Rationale

The design of `ApiService` is based on a simple principle:

> developers should never directly manipulate internal managers.

This ensures:

* preservation of core invariants
* reduced side effects
* stable public API
* ability to evolve managers without breaking the API

It is both a safety layer and an ergonomics layer.

---

## Relationships

### With Managers

`ApiService` directly delegates to:

* `StagesManager`
* `GlobalsManager`
* `ModulesManager`

It contains no internal logic.

---

### With the Developer

It is the single official entry point to:

* declare hooks
* configure runtime behavior

---

### With the Lifecycle

Hooks registered via `ApiService` are executed later, during the appropriate runtime phases.

The service does not control execution, only registration.

---

## Current Limitations

In v0.1:

* all exposed methods are considered stable within their current scope
* method names may evolve to improve clarity
* no plugin system is exposed yet
* API surface is intentionally limited

These limitations align with the v0.1 stability goals.

---

## Future Evolutions

Planned improvements include:

* better naming and API ergonomics
* new extension points (e.g., plugins)
* enhanced hooking capabilities
* better API structuring by domain

The goal is to evolve this API without ever exposing the core’s internal complexity.

---

## Conclusion

`ApiService` is the developer entry point into the core.

It does one thing:

> expose system capabilities in a controlled way.

It is intentionally simple, but essential to guarantee:

* a solid developer experience
* a stable API
* a clean architecture

---
