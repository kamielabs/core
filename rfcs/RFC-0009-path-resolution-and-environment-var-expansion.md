# RFC-0009 — Path Resolution and Environment Variable Expansion

Status: Implemented
Version: v0.1.0-rc.3
Author: Kame
Date: 2026-06-16

## Summary

This RFC introduces path resolution support inside the core runtime.

The implementation adds:

* Home directory alias expansion (`~`)
* Environment variable expansion (`$VAR`, `${VAR}`)
* Path normalization
* Stage env file path resolution
* Fix for builtin default stage file overrides

This feature allows users and tools to define portable and readable paths without relying on shell-side expansion.

---

## Motivation

Prior to this RFC, stage env files required fully resolved filesystem paths.

Examples such as:

```txt
~/.config/core/config.env

${HOME}/.config/core/config.env

$HOME/.config/core/config.env
```

were not supported.

This created unnecessary friction and prevented stage configuration from using common shell path conventions.

Additionally, builtin default stage file overrides were applied after stage resolution, causing env files to be loaded from incorrect locations.

---

## Goals

* Support Linux-like path aliases.
* Support Linux-like environment variable expansion.
* Normalize resulting filesystem paths.
* Resolve stage env file paths before env file loading.
* Preserve existing stage override precedence rules.

---

## Non Goals

This RFC does not introduce:

* Windows environment variable syntax (`%VAR%`)
* Filesystem namespace mapping (FSN)
* Runtime environment injection
* Cross-platform path abstraction layers
* Custom path aliases beyond builtin aliases

These topics may be revisited in future RFCs.

---

## Design

### Builtin Path Aliases

The core now maintains a path alias dictionary.

Current aliases:

```txt
~ -> ${HOME}
```

Aliases may define additional behaviors in future implementations.

---

### Environment Variable Expansion

The resolver supports:

```txt
$HOME
${HOME}
```

Resolution is performed using the supplied environment dictionary.

If a variable cannot be resolved:

* strict mode throws an error
* non-strict mode replaces the variable with an empty string

---

### Path Normalization

After alias and environment resolution, the resulting path is normalized using the platform path utilities.

Example:

```txt
/home/user//dev///core
```

becomes:

```txt
/home/user/dev/core
```

---

## Stage Resolution Fix

A defect existed in builtin default stage processing.

Builtin default stage file overrides were applied after env file loading.

This produced the following invalid order:

```txt
builtin
↓
env file
↓
defaults
↓
env vars
```

The implementation now resolves the effective stage file before env file loading.

Resulting precedence:

```txt
builtin
↓
defaults
↓
env file
↓
env vars
```

This matches the intended runtime behavior.

---

## Runtime Behavior

Supported examples:

```txt
~/.config/core/config.env
```

```txt
${HOME}/.config/core/config.env
```

```txt
$HOME/.config/core/config.env
```

All examples resolve to the same filesystem location when the HOME variable is available.

---

## Compatibility

This change is backward compatible.

Existing absolute paths continue to work unchanged.

No user migration is required.

---

## Future Work

Potential future extensions:

* Windows `%VAR%` syntax support
* Runtime environment injection from stages
* Runtime environment injection from globals
* Additional path aliases
* Cross-platform filesystem namespace abstraction

These topics remain intentionally out of scope for v0.x.
