# RFC-0006 — Context Decoupling & Targeted Mocking for Isolated Testing

## Status

Proposed (Post v0.1)

---

## Dependencies

This RFC depends on:

- RFC-0002-builtins-customs-merge-removal

---

## Context

The current architecture relies on a **monolithic runtime context**:

- all managers and services receive the full `Context`
- dependencies are accessed dynamically
- strong coupling exists between all components

While this design simplifies runtime orchestration, it introduces major limitations:

- difficult isolated testing
- heavy mocking requirements
- unnecessary coupling between unrelated components

---

## Problem

### 1. Over-Coupled Context

Managers and services currently receive the full context, even when only a subset is required.

This leads to:

- unnecessary dependencies
- poor separation of concerns
- fragile test setups

---

### 2. Difficult Testing

Testing a single manager requires:

- building a near-complete context
- mocking unrelated services
- maintaining large mock structures

---

### 3. Unsafe Testing Workarounds

Without proper isolation, testing requires:

- breaking runtime invariants
- injecting global flags
- modifying internal logic

These approaches are not acceptable long term.

---

## Goals

- Decouple managers/services from the full context
- Enable **targeted dependency injection**
- Allow lightweight and maintainable testing
- Avoid introducing test-specific logic into runtime
- Preserve runtime behavior and invariants

---

## Non-Goals

- Introducing alternate execution modes (no "dry mode")
- Modifying runtime lifecycle
- Supporting partial runtime execution

---

## Proposal

### 1. Context Decoupling

Managers and services MUST only receive the **subset of context they actually use**.

Example:

```ts
type ParserContext = {
  events: EventsManager
  helpers: CoreHelpers
}
````

Instead of:

```ts
ctx: FullContext ❌
```

They receive:

```ts
ctx: ParserContext ✔️
```

---

### 2. Partial Context Support

Managers MUST support **partial context injection**, enabling:

```txt
runtime → full dependency injection
tests   → minimal targeted injection
```

No manager should rely on unused context properties.

---

### 3. Manager-Specific Test Options

Managers MAY accept optional **test-only options**:

```ts
new ParserManager(ctx, {
  overridePhase?: ParserPhase,
  injectDraft?: ParsedCliContextResult
})
```

Constraints:

- strictly local to the manager
- no impact on runtime logic
- clearly marked as unsafe/internal

---

### 4. No Runtime Mode Switching

Managers MUST NOT implement:

```ts
if (testMode) { ... } ❌
if (!ctx) { ... } ❌
```

Behavior MUST remain identical regardless of environment.

---

### 5. Mock Strategy

Testing relies on **targeted mocks per context key**:

```txt
events   → mockEvents (required)
helpers  → real or mock
runtime  → mock when needed
```

A **mock per sub-context key** MUST be provided instead of a global mock.

---

### 6. Event Mocking Requirement

All managers depend on `events`.

Therefore:

```txt
mockEvents is mandatory in tests
```

This mock MUST:

- support `internalEmit`
- optionally record events
- optionally assert emitted events

---

### 7. Benefits

This approach provides:

```txt
✔ fine-grained dependency control
✔ minimal test setup
✔ reduced maintenance overhead
✔ better code readability
✔ strict separation of concerns
```

---

## Design Constraints

- No branching logic based on execution mode
- No global testing flags in runtime
- No full-context mocking requirement
- Core behavior must remain deterministic

---

## Risks

- Initial refactor effort
- Need to define context contracts per manager
- Potential duplication of small context types

---

## Mitigations

- Introduce context types progressively
- Document dependencies clearly
- Provide shared mock utilities

---

## Migration Plan

1. Identify dependencies used by each manager/service
2. Define minimal context interfaces per class
3. Refactor constructors to use partial context
4. Introduce manager-specific test options
5. Implement mock per context key
6. Update test strategy accordingly

---

## Conclusion

This RFC introduces a critical architectural improvement:

→ context decoupling

It transforms the system from:

```txt
monolithic / tightly coupled
```

to:

```txt
modular / testable / maintainable
```

without compromising:

- runtime determinism
- event-driven design
- architectural integrity

---

## Update_20260429

## 7. Test Factory Pattern

To support isolated testing without impacting runtime behavior, managers and services MUST implement a **static test factory pattern**.

---

### 7.1 Principle

Each class exposes two instantiation paths:

```txt
runtime → standard factory
tests   → test factory with controlled injection
````

---

### 7.2 API Design

Example:

```ts
class ParserManager {

  private constructor(
    private ctx: ParserContext,
    private testOptions?: ParserTestOptions
  ) {}

  static create(ctx: ParserContext) {
    return new ParserManager(ctx);
  }

  static createForTest(
    ctx: Partial<ParserContext>,
    options: ParserTestOptions
  ) {
    return new ParserManager(
      {
        events: ctx.events ?? createMockEvents(),
        helpers: ctx.helpers ?? createMockHelpers(),
      },
      options
    );
  }
}
```

---

### 7.3 Constraints

- `create()` is the ONLY entry point used in runtime
- `createForTest()` is strictly reserved for testing
- the constructor MUST remain private

---

### 7.4 Behavioral Guarantees

The test factory MUST NOT:

- modify core logic
- introduce alternate execution paths
- bypass validations
- disable events

It ONLY allows:

```txt
✔ dependency injection (mocked or partial)
✔ controlled state injection
✔ edge-case simulation
```

---

### 7.5 Test Options Policy

Test options MUST:

- be local to the manager
- be explicitly marked as unsafe

Example:

```ts
type ParserTestOptions = {
  __unsafe_overridePhase?: ParserPhase
  __unsafe_injectDraft?: ParsedContext
}
```

---

### 7.6 No Runtime Leakage

Test-related constructs MUST NOT:

- appear in public runtime APIs
- be stored in the global context
- influence runtime execution outside test scope

---

### 7.7 Benefits

This pattern ensures:

```txt
✔ clean separation between runtime and testing
✔ no pollution of the core architecture
✔ precise and maintainable unit tests
✔ full coverage of edge cases
```

---

## Conclusion (Update)

With context decoupling and test factories:

→ the core becomes fully testable at a granular level
→ without compromising runtime integrity or determinism

---
