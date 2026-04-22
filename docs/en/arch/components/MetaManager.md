# 🧱 MetaManager

## Description

`MetaManager` is a core component responsible for centralizing framework and CLI metadata.

In v0.1, it provides a minimal implementation based on static values defined at initialization.

It does not participate in runtime resolution and contains no dynamic logic.

---

## Purpose

`MetaManager` provides a single access point for metadata related to:

* the core itself
* the CLI built with the core

These data can be used to:

* display version information (`--version`)
* expose system information
* enrich logs or messages
* prepare future integrations with external tools

---

## Why This Manager Exists

Even if simple in v0.1, the need is real:

> the core must expose its own metadata in a centralized and consistent way.

Without it, metadata would be:

* scattered across the codebase
* harder to maintain
* harder to evolve

`MetaManager` establishes a clean foundation to:

* centralize metadata
* prepare its evolution toward a dynamic system

---

## Scope

In v0.1, `MetaManager` is intentionally limited.

It:

* stores static metadata
* exposes data through the context
* does not depend on other runtime components

It does not:

* retrieve version dynamically
* read from Git
* manage builds automatically
* sync with external tools
* allow hook-based customization

Its current role is purely declarative.

---

## Data Structure

The manager exposes a simple structure:

### Core

Framework-related information:

* `version`: core version
* `build`: build identifier (optional)
* `author`: core author
* `git`: repository link (optional)

---

### CLI

User CLI-related information:

* `name`: CLI name
* `version`: CLI version
* `author`: CLI author

This separation clearly distinguishes:

* the engine (core)
* the application (CLI)

---

## Behavior

The manager is initialized with a static dictionary.

Unlike other managers:

* it has no `resolve()` method
* it does not participate in runtime phases
* it emits no events
* it depends on no runtime data

It acts as a configuration component accessible at any time.

---

## Typical Usage

In v0.1, `MetaManager` is mainly used to:

* power the built-in `version` module
* expose basic CLI information
* serve as an entry point for metadata

It remains intentionally low-profile in the core workflow.

---

## Rationale

The current design is intentionally minimal.

The goal is not to build a full versioning system in v0.1, but to:

* establish a clear structure
* avoid metadata scattering
* prepare future evolution without breaking compatibility

It is a foundational component.

---

## Relationships

### With `ModulesManager`

The built-in `version` module can rely on data provided by `MetaManager`.

---

### With the CLI

Developers can inject or use metadata to enrich their CLI.

---

### With Future Components

`MetaManager` is intended to become a data source for:

* build systems
* CI/CD pipelines
* versioning tools

---

## Current Limitations

In v0.1:

* data is entirely static
* no Git integration
* no automatic versioning
* no build management
* no advanced validation

These limitations are known and intentional.

---

## Future Evolutions

Planned improvements include:

* integration with Git versioning
* automatic version generation
* build number management
* integration with build tools (e.g., tsup)
* richer CLI metadata
* enhanced exposure for plugins and tools

The goal is to evolve this component into a central metadata management system.

---

## Conclusion

`MetaManager` is a simple but foundational component.

In v0.1, it only stores static data, but it lays the groundwork for a more advanced system.

> it does almost nothing today, but it prevents having to rebuild everything tomorrow.

---
