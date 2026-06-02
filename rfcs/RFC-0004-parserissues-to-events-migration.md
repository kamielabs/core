# RFC-0004 — ParserIssues to Events Migration

## Status

Implemented for Test_Plan v0.1 ✅

---

## Context

The current `ParserManager` uses a dedicated structure called `ParserIssue` to collect non-fatal parsing problems during CLI parsing.

These issues are:

* accumulated during parsing phases
* stored in a local array (`issues`)
* returned as part of the parsed result
* interpreted later by the runner

This design predates the unified event system.

---

## Problem

The current `ParserIssue` system introduces a parallel mechanism that:

* duplicates the responsibility of the event system
* breaks observability consistency
* requires special handling outside of `EventsManager`
* prevents unified logging, tracing, and debugging

Additionally:

* ParserIssues are not part of the event lifecycle
* They cannot benefit from event indexing, listeners, or i18n
* They introduce a conceptual inconsistency in the core

---

## Goals

* Fully integrate parsing issues into the event system
* Remove the `ParserIssue` abstraction
* Maintain non-blocking behavior (no interruption of flow)
* Preserve deterministic parsing behavior
* Keep parsing performance and simplicity

---

## Proposal

### 1. Replace ParserIssues with Events

Each `ParserIssue` will become a **Core Event** with:

```txt
kind  = message
level = warning
phase = parser
```

These events:

* do NOT interrupt the flow
* are emitted during parsing
* follow the same lifecycle as all other events

---

### 2. Local Event Store (Parser Scope)

The parser will maintain a local store:

```ts
private _events: RuntimeCoreEvent[]
```

Instead of:

```ts
private issues: ParserIssue[]
```

This store:

* collects emitted parser events
* mirrors the current behavior of accumulating issues
* remains internal to the parser

---

### 3. Emission Strategy

During parsing:

* each issue becomes an event emitted via `EventsManager`
* the same event is also pushed into the local parser store

This ensures:

* global observability (via EventsManager)
* local access (for runner logic)

---

### 4. Event Schema Design

A dedicated event schema must be defined for parser issues.

Example:

```ts
parserUnknownFlag: {
  code: 'CORE_PARSER_UNKNOWN_FLAG',
  level: warning,
  kind: message,
  phase: parser,
  values: {
    flag: string
  }
}
```

Key requirements:

* explicit and deterministic naming
* structured `values` payload
* no ambiguity in interpretation

---

### 5. Removal of ParserIssue

After migration:

* `ParserIssue` type is removed
* all parsing anomalies are events
* `getIssues()` is replaced by:

```ts
getParserEvents(): RuntimeCoreEvent[]
```

---

### 6. Runner Adaptation

The runner logic will be updated to:

* inspect parser events instead of issues
* determine fallback behavior (e.g. help)
* remain deterministic

---

## Design Constraints

* No change to parsing algorithm behavior
* No introduction of additional parsing passes
* No performance degradation
* Strict alignment with existing event system

---

## Non-Goals

* Refactoring the parsing algorithm itself
* Changing CLI parsing semantics
* Introducing new parsing features

---

## Risks

* Increased complexity in event definitions
* Potential overproduction of events
* Migration effort across parser and runner

---

## Mitigations

* Strict event naming and structure rules
* Limit events to meaningful parser states
* Incremental migration with validation

---

## Migration Plan

1. Define parser event schema (names + values)
2. Introduce local parser event store
3. Replace `issues.push(...)` with event emission
4. Update runner to consume parser events
5. Remove `ParserIssue` type and related logic
6. Validate behavior against existing test cases

---

## Conclusion

This RFC aligns the parser with the core philosophy:

→ a single, unified, deterministic event system

It removes a legacy abstraction and strengthens consistency, observability, and maintainability of the core.

This change is intentionally deferred due to the critical nature of the parser and will be implemented after v0.1 stabilization.
