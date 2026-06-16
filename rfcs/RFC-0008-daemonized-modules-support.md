# RFC 0008 - Daemonized Modules Support

## Status

Proposed (V0.1.0-rc.3)

## Dependencies

* None

## Problem

Core currently supports only a synchronous runtime lifecycle:

```text
Parser
↓
Runtime
↓
BeforeAction
↓
Action
↓
AfterAction
↓
Exit
```

This model is sufficient for standard CLI applications but does not provide a standardized way to manage long-running background processes.

Projects built on top of Core, such as WSC, require support for:

* filesystem watchers
* workspace services
* background workers
* schedulers
* long-running agents

Today, each project must implement its own daemon lifecycle management, process spawning, PID tracking and status detection.

This logic is generic enough to belong to Core rather than being duplicated by consumers.

---

## Goals

Provide a reusable daemon lifecycle abstraction for Core consumers.

The solution must:

* support background process execution
* support daemon status detection
* support daemon start and stop operations
* expose daemon metadata through runtime contexts
* remain compatible with the existing module/action model
* avoid imposing a specific CLI workflow

The solution must not:

* enforce a specific daemon command structure
* require predefined actions such as start/stop/status
* introduce workflow conventions into Core

---

## Proposal

### Daemonizable Modules

Introduce an optional daemon definition on modules.

Example:

```ts
modules: {
 watch: {
  daemon: {
   id: "workspace-watcher"
  }
 }
}
```

A daemon definition declares that the module represents a daemon-capable service.

The daemon identifier must be unique within a CLI.

---

### Runtime Metadata

Daemon metadata becomes available through runtime contexts.

Example:

```ts
runtime.module.daemon
```

This metadata is available in:

* beforeAction hooks
* action hooks
* afterAction hooks

---

### Daemon Manager

Introduce a dedicated Core component:

```ts
DaemonManager
```

Responsibilities:

* daemon detection
* process spawning
* daemon runtime detection
* PID management
* status detection
* process cleanup

Implementation should be based on the proven daemon lifecycle algorithms previously implemented in WSC while remaining independent from legacy WSC runtime components.

---

### Tools API

Expose daemon operations through tools contexts.

Example:

```ts
tools.daemon.start(id)
tools.daemon.stop(id)
tools.daemon.status(id)
tools.daemon.isStarted(id)
```

Core provides lifecycle primitives only.

Workflow remains entirely controlled by the consumer.

---

### Runtime Lifecycle

Introduce an internal daemon lifecycle phase:

```text
Parser
↓
Runtime
↓
DaemonLifecycle
↓
BeforeAction
↓
Action
↓
AfterAction
```

Daemon resolution must occur before any user hook execution.

This guarantees that daemon spawning decisions happen before control is transferred to userland code.

---

## Design Constraints

### Core Must Remain Workflow Agnostic

Core must not introduce mandatory commands such as:

```text
start
stop
restart
status
```

Consumers remain free to expose daemon management however they want.

Examples:

```text
watch start
watch stop
watch status
```

or

```text
daemon start watcher
```

or

```text
doctor
```

or any other workflow.

---

### Daemon Ownership

Daemon definitions are attached to modules.

A daemon represents a functional service rather than an individual action.

This provides stronger structure than action-level daemonization while avoiding global daemon registries detached from the module system.

---

### Minimal Runtime Surface

Core should expose only generic lifecycle primitives.

Higher-level daemon orchestration remains the responsibility of consumers.

---

## Risks

### Scope Expansion

Daemon lifecycle management can easily expand into:

* service orchestration
* monitoring
* supervision
* process groups
* systemd integration
* distributed agents

The RFC must remain focused on local daemon lifecycle management only.

---

### Cross Platform Behaviour

Process spawning and lifecycle handling differ across:

* Linux
* macOS
* Windows

Implementation must define a portable abstraction layer while preserving deterministic behaviour.

---

### Future Evolution

Daemonized modules may later evolve into a dedicated Core runtime concept.

This RFC intentionally avoids introducing a new top-level runtime entity until real-world usage validates the need.

---

## Alternatives Considered

### Daemonized Actions

Rejected.

A daemon generally represents a service domain rather than a single action.

Action-level daemonization creates ambiguity for multi-action modules.

---

### Global Daemon Registry

Rejected.

A standalone daemon registry introduces weak coupling between daemon declarations and module definitions, reducing readability and increasing the risk of disconnected configurations.

---

## Conclusion

Core should provide daemon lifecycle primitives while remaining agnostic to daemon workflows.

Attaching daemon metadata to modules provides a clear and structured model that integrates naturally with the existing Core architecture.

This approach gives consumers the tools required to build daemon-capable applications without forcing a specific CLI design or operational model.
