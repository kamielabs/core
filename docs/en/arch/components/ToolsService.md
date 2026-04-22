# 🧱 ToolsService

## Description

`ToolsService` is the service responsible for exposing the tools available inside core hooks.

It provides sets of functions (*tools*) tailored to each execution context:

* stage
* globals
* module
* action

These tools allow developers to interact with the runtime in a controlled way, without directly accessing internal managers.

> The names exposed via `ToolsService` do not necessarily reflect internal core methods. They are designed to provide a simple and consistent developer-facing API (DX).

---

## Purpose

`ToolsService` provides a secure interface for performing actions from hooks.

It allows developers to:

* emit events (`signal`, `message`)
* interact with certain aspects of the runtime
* add runtime listeners
* (in the future) modify controlled runtime parameters

Its goal is clear:

> expose useful capabilities without allowing core invariants to be broken.

---

## Why This Service Exists

Hooks are powerful runtime entry points.

Without control, they could:

* modify critical data
* break runtime consistency
* introduce non-deterministic behavior

`ToolsService` exists to:

* limit what hooks can do
* adapt capabilities to runtime phase
* enforce strictly controlled mutations
* prevent direct access to managers

It is both a security layer and an API layer.

---

## How It Works

The service exposes methods that return a set of tools depending on the context.

Example:

```ts
tools: this.ctx.tools.stageContext()
````

Each context provides a specific subset of capabilities.

---

## Available Contexts

### Stage

```ts
stageContext()
```

Available tools:

* `signal()`
* `setCwd()` (placeholder in v0.1)

This context is intentionally minimal.

At this stage:

* runtime is not fully built
* only highly controlled mutations are allowed

---

### Globals

```ts
globalsContext()
```

Available tools:

* `signal()`
* `message()`
* `addListener()`

This context allows:

* emitting events
* adding runtime listeners

Since i18n is available at this point, `message()` is allowed.

---

### Module

```ts
moduleContext()
```

Available tools:

* `signal()`
* `message()`

The runtime is nearly finalized but still partially mutable.

Capabilities remain intentionally limited.

---

### Action

```ts
actionContext()
```

Available tools:

* `signal()`
* `message()`

At this stage:

* runtime is frozen
* execution is business logic

No structural mutation is allowed.

---

## Event Emission

Core tools include:

### `signal()`

Emits a `signal` event.

```ts
tools.signal("mySignal", { details: [...] })
```

---

### `message()`

Emits a `message` event.

```ts
tools.message("myMessage", { values: {...} })
```

---

### Important Restriction

Tools only allow emitting:

* **custom events**

Internal core events remain protected.

---

## Adding Listeners

In the globals context:

```ts
addListener(handler)
```

Allows adding a runtime listener on the default channel.

Use cases:

* redirect output
* add a custom logger
* integrate external systems

---

## `setCwd()` (planned)

The `setCwd()` tool is intended to allow controlled mutation of the working directory.

Typical use cases:

* sandboxing
* environment isolation
* workspace redirection

In v0.1:

* method exists
* not yet implemented

This is intentional:

> it will be validated through real-world use before finalization.

---

## Capability Separation

A key design principle:

> not all hooks have access to the same tools.

Why?

Each runtime phase has constraints:

* stage → environment under construction
* globals → configuration in progress
* module → transition to execution
* action → frozen runtime

This separation ensures:

* reduced risk
* deterministic runtime
* precise control of entry points

---

## Rationale

The design of `ToolsService` follows a key principle:

> a hook should never have more power than necessary.

This ensures:

* runtime safety
* minimal side effects
* predictable architecture
* easier reasoning

This is a **capability-based** approach rather than global access.

---

## Relationships

### With `EventsManager`

`signal()` and `message()` delegate directly to `EventsManager`.

---

### With `RuntimeService`

Some tools (like future `setCwd()`) will interact with runtime through controlled mutations.

---

### With Hooks

The service is used exclusively in hooks via:

```ts
tools: this.ctx.tools.*
```

---

### With Plugins (future)

`ToolsService` is intended to become the injection point for plugin-provided tools.

---

## Current Limitations

In v0.1:

* `setCwd()` is not implemented yet
* available tools are intentionally limited
* no plugin system is connected
* capabilities are fixed and not extensible

These limitations are consistent with a first stable version.

---

## Future Evolutions

Planned improvements include:

* full implementation of `setCwd()`
* new tools
* plugin system integration
* dynamic capability extension
* refined security model

---

## Conclusion

`ToolsService` is the component that gives power to hooks without compromising core stability.

It follows a simple rule:

> expose only what is necessary, when it is necessary.

This approach makes the core:

* extensible
* secure
* deterministic

---
