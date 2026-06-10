# IDEA 0002 - Create path resolution service for managing all pathes

## Status

Idea

## Context

The Core currently relies on raw path strings provided by developers or runtime configuration.

Examples:

* Stage env files
* Working directories
* Sandbox paths
* Configuration files
* Logs directories
* Templates directories
* Future plugins directories

At the moment, all paths must be provided as fully resolved paths.

This approach works but lacks portability and flexibility across environments and operating systems.

---

## Problem Statement

The Core currently has no centralized path resolution mechanism.

As a result:

* Home directory shortcuts are not supported.
* Environment variables inside paths are not supported.
* Path resolution logic may be duplicated across projects.
* Future consumers (WSC and others) would need to implement their own path resolution logic.

Examples currently not supported:

```text
~/.config/wsc/config.env

$HOME/.config/wsc/config.env

${HOME}/.config/wsc/config.env

%USERPROFILE%\AppData\Local\wsc
```

---

## Goals

Provide a single and reusable path resolution service capable of resolving paths before they are consumed by the runtime.

Potential use cases:

* Stage configuration files
* Working directories
* Sandbox directories
* Runtime configuration files
* Future plugin paths
* Future template paths
* Future cache and log paths

---

## Expected Features

### Home Directory Expansion

Examples:

```text
~/.config/wsc
```

↓

```text
/home/user/.config/wsc
```

---

### Environment Variable Expansion

Unix style:

```text
$HOME/.config/wsc

${HOME}/.config/wsc
```

Windows style:

```text
%USERPROFILE%\AppData\Local\wsc
```

---

### Platform Normalization

Provide consistent path handling across:

* Linux
* macOS
* Windows

---

## Potential Future Features

The following features may be considered later but are not required initially:

* Relative path resolution helpers
* Workspace-relative paths
* Config-relative paths
* Path validation helpers
* Path existence helpers
* Path permission helpers

---

## Non Goals

The service should not:

* Execute shell commands
* Perform shell expansion
* Implement globbing
* Replace filesystem APIs

Its responsibility should remain limited to path resolution and normalization.

---

## Open Questions

* Should this be implemented as a helper, provider, or service?
* Should path resolution happen automatically or explicitly?
* Should unresolved variables throw errors or remain untouched?
* Should custom runtime variables be supported in the future?
* How should workspace-relative paths be handled?

---

## Motivation

This capability will become increasingly important as the Core evolves and more features rely on user-provided paths.

Introducing a dedicated path resolution service would:

* Avoid duplicated logic
* Improve portability
* Simplify runtime configuration
* Provide a single source of truth for path handling
