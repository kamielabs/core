# 🧠 Design Principles

## Purpose

This document summarizes the core design principles of the CLI.

For detailed behavior:

- see managers/*
- see services/*
- see LIFECYCLE.md

---

## Core Principles

### 1. Deterministic Runtime

The CLI is fully deterministic:

- no backtracking
- no ambiguous parsing
- single-pass resolution

---

### 2. Strict Separation of Phases

The system is divided into:

- init (declarative)
- hooks (controlled mutation)
- runtime (execution)

Each phase has strict rules and boundaries.

---

### 3. Runtime Immutability

- Managers produce frozen facts
- Runtime is mutable only through controlled services
- Final runtime is fully immutable

---

### 4. Explicit over Magic

- No implicit behavior
- No hidden resolution
- Everything is declared and predictable

---

### 5. Extensibility by Design

- Core is minimal and strict
- All behaviors can be extended via hooks and tools
- No hard-coded business logic

---

### 6. Single Token Parsing Model

- Flags must be self-contained (`--flag=value`)
- No multi-token parsing
- Ensures deterministic behavior

---

## Summary

The core is designed to be:

- predictable
- extensible
- strictly bounded

For implementation details, refer to managers and services documentation.
