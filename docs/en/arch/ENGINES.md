# ⚙️ Engines

## Description

Engines are responsible for runtime execution.

They orchestrate the different lifecycle steps using the `RuntimeService`, without ever rebuilding the runtime themselves.

Their role is simple:

* call phases in the correct order
* trigger runtime construction
* execute the final `runner`

---

## Purpose

Engines define **different runtime execution strategies**.

They allow:

* procedural execution of the core
* or event-driven execution

The goal is clear:

> separate runtime execution logic from runtime construction.

---

## CoreEngine (Selector)

`CoreEngine` is the entry point for engines.

It does one thing:

* select which engine to use based on settings

```ts
const engineName = this.ctx.settings.engine ?? 'std';
````

Then:

* instantiate the corresponding engine
* provide it with the `runner`
* delegate execution

---

### Role

* select the engine
* inject context
* pass the runner

👉 It contains no execution logic.

---

## Available Engines

In v0.1, two engines are available:

* `StandardEngine`
* `FedEngine`

---

## StandardEngine

### Description

`StandardEngine` executes the runtime procedurally.

It calls phases in order:

```text
init → bootstrap → stage → globals → action → ready → runner
```

---

### Behavior

```ts
await this.ctx.runtime.setInit();
await this.ctx.runtime.setBootstrap();
await this.ctx.runtime.setStage();
await this.ctx.runtime.setGlobals();
await this.ctx.runtime.setAction();
await this.ctx.runtime.setReady();
await this.runner();
```

---

### Characteristics

* simple
* readable
* predictable
* no additional abstraction

This is the recommended default mode.

---

### Usage

Suitable for:

* most CLI use cases
* standard behavior
* clear and direct runtime flow

---

## FedEngine (Event-Driven)

### Description

`FedEngine` (Full Event-Driven) controls the runtime entirely through events.

Instead of chaining calls, it:

* registers itself as a listener on lifecycle events
* triggers steps in reaction to those events

---

### Behavior

Each phase is triggered by an event:

```text
runtimeInit → bootstrapReady → stageReady → globalsReady → actionReady → runtimeReady
```

Example:

```ts
events.registerFlowListener("bootstrapReady", {
  handler: async () => {
    await this.ctx.runtime.setStage();
  }
});
```

---

### Final Execution

When `runtimeReady` is emitted:

```ts
await this.runner();
```

---

### Characteristics

* fully event-driven
* decoupled from procedural flow
* extensible
* observable

---

### `trigger` Flag Role

`FedEngine` relies on events marked with:

```ts
trigger: true
```

This defines which events actually drive the execution flow.

---

### Usage

Suitable for:

* event-driven architectures
* extensible systems
* advanced use cases (plugins, complex orchestration)

---

## Runner

The `runner` is provided by the `ModulesManager`.

It is responsible for:

* selecting the action to execute
* handling fallbacks (e.g., help)
* executing the action hook

Engines do not know business logic:

> they simply execute the runner.

---

## Engine Contract

An engine must:

* respect runtime order
* call `RuntimeService` methods
* never rebuild the runtime itself
* execute the runner only after `setReady()`

---

## Relationship with RuntimeService

Engines fully depend on the `RuntimeService`.

They must:

* call its methods (`setInit`, `setBootstrap`, etc.)
* respect transitions
* never bypass its behavior

👉 `RuntimeService` remains the single source of truth for runtime integrity.

---

## Rationale

The design relies on a clear separation:

* `RuntimeService` → builds the runtime
* `Engine` → orchestrates execution

This enables:

* multiple execution strategies
* better extensibility
* guaranteed runtime consistency

---

## Current Limitations

In v0.1:

* only two engines available
* no public custom engine system
* `FedEngine` depends on the existing event system

These limitations are intentional to keep the core simple.

---

## Future Evolutions

Possible improvements include:

* support for custom engines
* enhanced event-driven capabilities
* debugging tools for event flow
* integration with the future plugin system

---

## Conclusion

Engines define how the runtime is executed, without ever modifying its construction.

Two approaches are available:

* procedural (`StandardEngine`)
* event-driven (`FedEngine`)

> the runtime remains the same, only the execution strategy changes.
