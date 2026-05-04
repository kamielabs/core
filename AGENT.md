# AGENT.md — Core Development Guidelines

## 🧠 Context

You are working on a TypeScript CLI core designed to be:

- deterministic
- strongly typed
- modular
- extensible via hooks and events

The system is **not a typical app**, it is a **runtime engine**.

---

## 🎯 Core Principles

### 1. Determinism first

- No uncontrolled async behavior
- All async operations must be explicitly awaited
- No hidden side effects

---

### 2. No sandboxing or simulation

- The environment is already isolated (local VM)
- NEVER sandbox, mock, or simulate execution
- ALWAYS work on real code

---

### 3. Type safety is mandatory

- Strict TypeScript
- No `any`
- No unsafe casts unless absolutely necessary
- Prefer inference + generics

---

### 4. Simplicity over cleverness

- No over-engineering
- No unnecessary abstraction
- Keep logic readable and explicit

---

## ⚙️ Architecture Rules

### Events System

- Events are the core communication layer
- Two kinds:
  - `signal`
  - `message`

- Levels:
  - trace
  - debug
  - info
  - warning
  - error
  - fatal

---

### Event Emission

Internal API:

- `emit()` → trace/debug/info
- `warn()` → warning
- `throw()` → error/fatal (terminal)

External API (tools):

- `tools.signal.*`
- `tools.message.*`

---

### Terminal Events

- `throw()` MUST:
  - return `never`
  - stop execution immediately
  - trigger process exit

---

### Async Model

- Core must remain deterministic
- Async is allowed ONLY when:
  - explicitly awaited
  - controlled

---

### Event Dispatch

- Output handlers:
  - may be async
  - must NOT throw
  - must NOT alter core behavior

- Parallel execution via `Promise.all` is a future rule, not yet implemented in the current runtime
- When implemented, it must always remain explicitly awaited

---

### Flow System

- Flow listeners are NOT exposed (for now)
- Event recursion must be controlled via:
  - depth limit
  - repetition limit (same event)

---

## 🚫 Forbidden Patterns

- No fire-and-forget async
- No implicit state mutation
- No event emission loops without guards
- No business logic inside output handlers

---

## 🧪 Testing Philosophy

- Prefer full-flow tests over isolated unit tests
- System behavior > isolated logic

---

## 🧩 Coding Style

- Explicit naming
- No magic
- No hidden logic
- Prefer clarity over conciseness

---

## 📦 File Scope

When modifying a file:

- Only change what is necessary
- Do NOT refactor unrelated parts
- Preserve existing architecture

---

## 🧠 Expected Behavior

When asked to modify code:

- Understand the context first
- Do not guess missing parts
- Ask for clarification if needed

---

## 📌 Output Rules

- Provide clean, minimal diffs when possible
- Avoid unnecessary explanations
- No verbosity unless requested

---

## 🧭 Goal

Help maintain a clean, deterministic, and robust core runtime.

Do NOT try to be clever. Be precise.

---
