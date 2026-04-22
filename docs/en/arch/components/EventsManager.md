# 🧱 EventsManager

## Description

`EventsManager` is the first class initialized by the core and the first component available in the global context.

It is accessible from initialization, even before runtime starts, and remains available to all managers, services, engines, and other core components.

Its role is to centralize the entire event system of the framework.

In v0.1, it handles two types of events:

* `signal`
* `message`

Each event must include:

* a `kind`
* a `phase`
* a `level`

`EventsManager` is not only used to emit or store events.  
It also forms the foundation for the listener system, channel-based routing, flow orchestration, and runtime termination control.

---

## Purpose

`EventsManager` provides a unified event system used across the entire core.

It allows to:

* declare and emit typed events
* store runtime event history
* index events by type, level, and phase
* listen to events across multiple logical layers
* manage runtime outputs via channel-based listeners
* trigger flow transitions
* interrupt runtime on error or fatal events

Its purpose is to provide a shared foundation for:

* core observability
* runtime communication
* event-driven orchestration

---

## Why This Manager Exists

The core is built around a strongly event-driven model.

Events are not only used for logging.  
They are used to propagate runtime state, trigger reactions, and drive engines such as `FedEngine`.

`EventsManager` centralizes several critical responsibilities:

* event emission
* live runtime event storage
* listener dispatching
* output channel management
* flow triggering
* automatic termination on critical events

Without it, the core would lose:

* orchestration consistency
* unified observability
* true event-driven runtime control

---

## Scope

In v0.1, `EventsManager` is responsible for:

* exposing the final event dictionary
* creating runtime events with IDs and timestamps
* storing event history
* indexing live events
* registering and removing listeners
* supporting simple, wildcard, and `once` listeners
* managing system, flow, and runtime listeners
* routing outputs via channels
* dispatching events based on the active engine
* interrupting flow on error or fatal

It does not:

* perform message translation
* implement business logic
* resolve runtime state
* select the engine

However, it provides the foundation used by most of these components.

---

## Event Types

In v0.1, the core supports two event types:

### `signal`

A `signal` carries technical or structural runtime information.

It may include:

* `details`

As long as the language is not available, this is the only fully usable event type.

---

### `message`

A `message` represents a translatable event intended to produce localized output.

It may include:

* `values` injected into the message

`message` events should only be used once i18n is resolved.

---

## Levels and Phases

Each event includes:

* a level (`level`)
* a phase (`phase`)
* a type (`kind`)

These metadata structure the entire system.

---

### Level

The level defines severity or nature.

Typical examples:

* trace
* debug
* info
* warning
* error
* fatal

`error` and `fatal` levels directly impact runtime termination.

---

### Phase

The phase indicates when in the lifecycle the event was emitted.

Examples:

* declarative
* bootstrap
* stage
* parser
* globals
* modules
* single
* runtime

---

### Kind

The kind distinguishes:

* technical signals
* translatable messages

---

## Runtime Availability

`EventsManager` is the first active component in the core.

It is available:

* at initialization
* before runtime
* throughout runtime
* inside hooks and business execution

However, usable capabilities evolve with runtime state.

Before language resolution:

* only `signal` events are safe

After i18n resolution:

* `message` events become usable

This distinction is fundamental to the core design.

---

## What This Manager Produces

`EventsManager` maintains a live runtime event state.

This includes:

* chronological event list
* access by ID
* indexes by kind
* indexes by phase
* indexes by level

It does not produce a static snapshot—it maintains a live, evolving view throughout execution.

---

## Runtime History and Indexing

On each emission, the manager:

1. creates a runtime event
2. assigns a unique ID
3. assigns a timestamp
4. adds it to the live list
5. indexes it by:

   * kind
   * phase
   * level

This enables:

* full history access
* efficient querying
* improved debugging, observability, and advanced listener tooling

---

## Event Emission

The core system relies on an internal emission method, used by public APIs.

When an event is emitted:

1. the declared definition is retrieved from the dictionary
2. a runtime event is created
3. dynamic data is injected based on type:

   * `details` for signals
   * `values` for messages
4. system and runtime listeners are dispatched via channels
5. flow listeners may be triggered
6. terminal control is applied
7. the runtime event is returned

This sequence is the backbone of the system.

---

## Listeners

The manager supports three main listener categories.

---

### System Listeners

Base listeners for output and system behavior.

They are always executed.

---

### Flow Listeners

Used to drive event-based runtime flow.

Critical for engines like `FedEngine`.

Triggered only under specific conditions:

* active `fed` engine
* event defined with `trigger: true`

---

### Runtime Listeners

Dynamically added listeners (via tools or future extensions).

They can override system listeners via channels.

---

## Wildcards and `once` Listeners

The system supports:

* specific event listeners
* wildcard listeners (`*`)
* `once` listeners (auto-removed after first execution)

This provides flexibility without breaking the typed model.

---

## Output Channels

Listener dispatch is based on **channels**.

Process:

1. group handlers by channel
2. merge system and runtime channels
3. apply runtime priority over system on same channel

Meaning:

* runtime listener overrides system listener on same channel
* otherwise, system listener is used

This enables a true channel-based output system.

Examples:

* default system output
* custom runtime outputs
* developer-added listeners

---

## Flow and Event-Driven Engines

Flow control is a key responsibility.

Some events may include:

* `trigger: true`

When active and using `fed` engine:

* flow listeners are triggered

This enables engines like `FedEngine`, fully event-driven.

In this model:

* runtime progresses via event reactions, not direct calls
* the manager becomes a central orchestration component

This is why `EventsManager` is one of the core algorithmic pillars.

---

## Terminal Control

The manager also controls runtime termination.

In v0.1:

* `error` events terminate the process
* `fatal` events terminate the process

Meaning:

> some events do not just inform—they end execution.

This is a fundamental design choice.

The event system is not passive—it has authority over execution.

---

## Main APIs

### Listener Registration

* `registerSystemListener()`
* `registerFlowListener()`
* `registerRuntimeListener()`

---

### Listener Removal

* `offSystemListener()`
* `offFlowListener()`
* `offRuntimeListener()`

---

### One-time Listeners

* `onceSystemListener()`
* `onceFlowListener()`
* `onceRuntimeListener()`

---

### Emission

* `internalEmit()`
* `emitSignal()`
* `emitMessage()`
* `emit()`

---

### Store Access

* `get()`
* `getAll()`
* `getEventsByKind()`
* `getEventsByPhase()`
* `getEventsByLevel()`

---

## Usage Context

`EventsManager` is used everywhere:

* managers
* services
* hooks
* tools
* engines

It is one of the most transversal components.

It acts as the common language of the runtime.

---

## Rationale

The design is based on a strong idea:

> an event must be observable, routable, usable for flow control, and able to terminate execution.

This goes beyond simple logging.

It enables a core that is:

* observable
* controllable
* extensible
* compatible with multiple engine styles
* consistent throughout runtime

Along with `ParserManager` and `ModulesManager`, it forms one of the three main algorithmic pillars of the core.

Other components build around them—they define the framework’s behavior.

---

## Relationships

### With all managers and services

`EventsManager` is available early and acts as a transversal dependency.

---

### With `I18nManager`

i18n determines when `message` events can be used.

Before resolution, only `signal` should be used.

---

### With tools

Tools expose emission and listener capabilities but rely on `EventsManager` internally.

---

### With engines

Standard engines use it for observation and signaling.

`FedEngine` directly depends on its flow capabilities.

---

### With runtime output

Channels connect `EventsManager` to runtime output handling.

---

## Current Limitations

In v0.1:

* termination logic still relies on `process.exit`
* some output category separation may evolve
* internal polish is still ongoing
* emission APIs may be refined later
* coupling with future runtime listener systems may evolve

These do not weaken the design but highlight natural improvement areas.

---

## Future Evolutions

Future improvements may include:

* refined terminal control
* clearer emission APIs
* improved channel system
* extended event-driven flow capabilities
* better integration with future plugins and advanced tools

The core design should remain unchanged:

* typed events
* structured dispatch
* controllable flow
* managed termination

---

## Conclusion

`EventsManager` is the most transversal and one of the most critical components of the core.

It does not just store or broadcast events.  
It provides a live system capable of:

* tracing runtime
* routing outputs
* notifying the system
* driving execution flow
* terminating execution when needed

This combination of observability, orchestration, and control makes it a foundational pillar of the framework.

---
