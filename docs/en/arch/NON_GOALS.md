# NON_GOALS

This document defines architectural constraints that are intentionally outside the scope of the runtime.

These items are not considered missing features.

They are deliberate design decisions.

Any proposal conflicting with these constraints should be considered incompatible with the current runtime architecture.

---

## 1. No Backtracking Parser

The parser must remain fully deterministic.

A token must have a single meaning at the moment it is read.

Forbidden:

* Backtracking
* Token reinterpretation
* Multi-pass parsing
* Route retrying
* Post-parse command reconstruction

The parser must resolve commands through a single left-to-right pass.

---

## 2. No Dynamic Runtime Grammar

The runtime grammar must be fully known before execution.

Forbidden:

* Runtime module creation
* Runtime action creation
* Dynamic parser mutation
* Runtime grammar injection
* Runtime route registration after initialization

Modules, actions, globals and stages must be declared and validated before runtime execution begins.

---

## 3. No Multi-Token Value Flags

Flags carrying values must remain self-contained.

Allowed:

```txt
--lang=fr
--config=./config.json
```

Forbidden:

```txt
--lang fr
--config ./config.json
```

The parser must never require future tokens to determine the meaning of the current token.

---

## Why These Constraints Exist

These constraints guarantee:

* Deterministic parsing
* Predictable routing
* Reliable introspection
* Stable snapshots
* Simpler validation
* Long-term maintainability

The objective of this runtime is not to maximize flexibility.

The objective is to provide a deterministic and maintainable runtime contract.

---

## Future Evolution

Future versions may introduce new capabilities, APIs, plugins or tooling layers.

However, such evolutions must preserve the constraints defined in this document.

These constraints are considered architectural invariants.
