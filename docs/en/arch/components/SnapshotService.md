# 🧱 SnapshotService

## Description

`SnapshotService` is the service responsible for exposing a complete snapshot of the core’s declaration dictionaries.

It provides read-only access to all declarative data:

* events
* stages
* translations
* globals
* modules

This snapshot is available in all hooks via the context.

---

## Purpose

`SnapshotService` provides a global and consistent view of the CLI configuration as defined at initialization.

It allows to:

* inspect the full CLI structure
* access module and action definitions
* read declarative configurations
* build dynamic behaviors based on declarations

Its goal is simple:

> provide a complete system view without allowing mutation.

---

## Why This Service Exists

The core enforces a strict separation between:

* declaration (init)
* resolution (runtime)
* execution (hooks)

However, developers sometimes need to:

* understand the full CLI structure
* access information not present in runtime
* introspect declarations

Without `SnapshotService`, this would require:

* exposing managers directly
* breaking encapsulation
* introducing mutation risks

This service exists to provide:

* a global view
* without breaking core invariants

---

## Scope

In v0.1, `SnapshotService` is responsible for:

* exposing complete declarative dictionaries
* providing simple and consistent access in hooks
* guaranteeing read-only access

It does not:

* transform data
* implement business logic
* resolve runtime
* perform validation
* allow mutation

It acts purely as an exposer.

---

## How It Works

The service builds a snapshot object on demand:

```ts
snapshotContext()
````

This snapshot includes:

* `settings`
* `events`
* `stages`
* `i18n`
* `globals`
* `modules`

These data come directly from internal manager dictionaries.

---

## Snapshot Nature

The snapshot is:

* complete
* consistent
* immutable

Why?

Because all dictionaries:

* are built at initialization
* are validated at creation
* are then frozen (`freeze`)

This guarantees:

> a single source of truth, identical across the runtime.

---

## Availability in Hooks

The snapshot is accessible in all hooks via:

```ts
snapshot: this.ctx.snapshot.snapshotContext()
```

This allows developers to:

* read full configuration
* adapt behavior dynamically
* introspect the CLI independently of runtime state

---

## Difference from Runtime

This is a key distinction.

Snapshot represents:

👉 the **initial declaration**

Runtime represents:

👉 the **resolved state during execution**

Example:

* snapshot → all declared modules
* runtime → currently executed module

This distinction is fundamental to the core design.

---

## Use Cases

Snapshot is especially useful for:

* dynamically generating help (`help`)
* introspecting available modules
* building generic behaviors
* creating debug tools
* analyzing CLI configuration

---

## Safety and Invariants

The snapshot is strictly read-only.

It is impossible to:

* modify dictionaries
* inject values
* alter configuration

This guarantees:

* runtime stability
* declaration integrity
* no side effects

---

## Rationale

The design is based on a simple idea:

> provide visibility without granting mutation power.

This enables:

* full introspection
* without compromising core stability
* without exposing internal managers

It is a transparency layer, not a control layer.

---

## Relationships

### With Managers

The service reads directly from global settings and manager dictionaries:

* `CLISettings`
* `EventsManager`
* `StagesManager`
* `I18nManager`
* `GlobalsManager`
* `ModulesManager`

It never modifies these data.

*N.B.: Settings represent the global CLI configuration at initialization and allow hooks to adapt behavior based on execution mode.*

---

### With Hooks

Snapshot is primarily used in hooks for:

* introspection
* dynamic logic
* debugging

---

### With `ApiService` and `ToolsService`

Snapshot is exposed through hook contexts.

---

## Current Limitations

In v0.1:

* snapshot is rebuilt on each call
* no partial views are available
* no transformation or filtering is applied

These are acceptable given the simplicity and low cost of the operation.

---

## Future Evolutions

Possible improvements include:

* snapshot construction optimization
* partial or filtered views
* advanced introspection tools
* integration with debug or documentation tools

---

## Conclusion

`SnapshotService` is a simple but essential component.

It provides a complete and immutable view of the CLI configuration.

> it lets you see the entire system… without ever being able to break it.

This combination of transparency and safety makes it a key tool for hooks and core introspection.

---
