# Dependencies

This document lists all external dependencies used in the project,
along with their validation status and constraints.

---

## Philosophy

This project follows a strict dependency policy:

- Minimal external dependencies
- Manual review of source code before inclusion
- Version locking (no implicit upgrades)
- Preference for deterministic and auditable libraries

---

## Dependencies List

### ulid (v3.0.2)

- Source: <https://github.com/ulid/javascript>
- License: MIT

#### Usage

Used for generating unique identifiers within the event system.

#### Validation

The source code of this version has been manually reviewed to ensure:

- No external or hidden dependencies
- No dynamic or unsafe behavior
- Pure JavaScript/Typescript implementation
- No network or filesystem side effects
- Internal helper `detectRoot()` uses `any`
  - Scope: internal only, not exposed
  - No type leakage into core
  - No side effects or global mutations
    → Accepted

#### Policy

- Version is strictly locked to `3.0.2`
- No automatic upgrades (`^` and `~` are not allowed)
- Any version update must go through:
  - manual review
  - validation update in this document

---

## Runtime Dependencies

### Node.js

- Runtime environment
- No bundled external code from Node is relied upon beyond standard APIs

---

## Summary

The project intentionally limits its dependency surface to ensure:

- Predictability
- Security
- Long-term maintainability
