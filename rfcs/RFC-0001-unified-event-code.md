# RFC — Unified Event Code System

## 🧭 Status

* Proposed
* Target version: ≥ v0.2.0 (post v0.1 stabilization)

---

## 🎯 Objective

Introduce a **unified, minimal, and deterministic code system** for:

* runtime events (signals & messages)
* error classification (core & userland)
* process exit resolution

The goal is to **standardize event identification** while keeping the core:

* simple
* extensible
* free of redundant metadata layers

---

## ❗ Problem Statement

Current and potential issues:

* ambiguity between `eventCode`, `errorCode`, and `exitCode`
* risk of over-engineering with multiple overlapping identifiers
* lack of a **single canonical identifier** for events
* difficulty ensuring long-term stability and readability

Additionally:

* `process.exit` constraints (Unix: 0–255) conflict with large numeric code systems
* distinction between `error` and `fatal` is not cleanly represented in exit codes

---

## 💡 Proposed Solution

### 1. Single Canonical Code (string-based)

Each event MUST define a unique `code`:

```ts
code: 'E00100'
```

### Format

```text
<LEVEL_PREFIX><5_DIGIT_ID>
```

#### Level prefixes

| Prefix | Level   |
| ------ | ------- |
| F      | fatal   |
| E      | error   |
| W      | warning |
| I      | info    |
| D      | debug   |
| T      | trace   |

#### Examples

* `F00001` → fatal runtime failure
* `E00210` → bootstrap error
* `E00512` → parser error
* `W00703` → i18n warning
* `I00200` → bootstrap info
* `T00800` → trace event

---

### 2. Validation Rules

All codes MUST match:

```regex
^[FEWIDT]\d{5}$
```

Additionally:

* prefix MUST match the declared event level
* numeric part MUST be unique within its scope

---

### 3. Semantic Structure (Recommended)

Numeric ranges SHOULD be reserved:

| Range       | Domain              |
| ----------- | ------------------- |
| 00000–00199 | runtime / bootstrap |
| 00200–00499 | core lifecycle      |
| 00500–00699 | parser              |
| 00700–00899 | i18n                |
| 01000+      | userland            |

---

### 4. Process Exit Strategy

`process.exit` MUST NOT directly use the numeric portion of the code.

Instead, a simplified mapping is enforced:

| Exit Code | Meaning                |
| --------- | ---------------------- |
| 0         | success                |
| 1         | unclassified error     |
| 2         | internal/runtime error |
| 3         | core error             |
| 4         | userland error         |

---

### 5. Exit Resolution

Exit codes MUST be resolved via a centralized function:

```ts
function resolveExitCode(code: string): number;
```

Rules:

* `F*` and `E*` → eligible for process exit
* mapping based on domain (internal/core/user)
* `W/I/D/T` → MUST NOT trigger exit

---

### 6. Design Principles

#### ✅ Single Source of Truth

The `code` field is the only canonical identifier.

#### ✅ No Redundant Fields

No `errorCode`, `eventId`, or additional numeric identifiers.

#### ✅ Readability First

Codes are human-readable and self-descriptive.

#### ✅ Deterministic Mapping

Exit codes are derived, not embedded.

#### ✅ Extensibility

Userland can define codes freely (`01000+`) without collision.

---

## 🚫 Non-Goals

* Do not encode full semantics in exit codes
* Do not introduce multiple parallel identification systems
* Do not rely on large numeric exit codes (>255)

---

## 🔮 Future Extensions

* CLI tooling for code validation
* automated documentation generation from event codes
* mapping to structured logs / observability systems
* plugin-level code namespaces

---

## 📌 Summary

This proposal introduces:

* a **single, typed, string-based code system**
* a **strict format and validation model**
* a **minimal process exit mapping**

Result:

* reduced complexity
* improved clarity
* long-term maintainability
* strong foundation for observability and extensibility

---

## 🧠 Key Insight

> One canonical code for identity, one minimal mapping for system interaction.

---
