# Filesystem Namespace Abstraction Layer

## Status

Idea

## Summary

Introduce a filesystem namespace abstraction layer in Core to provide a deterministic, platform-independent way to define and resolve filesystem paths.

Instead of exposing operating system specific paths directly inside applications, tools would declare logical namespaces and let Core resolve them according to the current runtime platform.

The goal is not only to simplify cross-platform development, but also to provide a unified filesystem API similar to how Core already abstracts events, states and i18n.

---

## Problem Statement

Filesystem paths are one of the last areas where applications still directly depend on operating system implementation details.

Examples:

### Windows

```txt
C:\Projects
%USERPROFILE%
%APPDATA%
\\server\share
```

### Unix-like systems

```txt
/home/user/projects
${HOME}
/etc
/mnt/storage
```

Even with Node.js providing path normalization helpers, applications still need to know:

* where data should be stored
* which root directory should be used
* how paths are represented on each platform
* how environment variables differ between operating systems

This creates unnecessary coupling between business logic and filesystem topology.

---

## Initial Idea

Applications should express filesystem intent rather than physical locations.

Instead of:

```txt
/home/user/workspaces
```

or

```txt
H:\Workspaces
```

applications would reference:

```txt
{WORKSPACES}
```

and let Core resolve the final path.

Example:

```txt
{WORKSPACES}/core
```

Runtime resolution:

### Linux

```txt
/mnt/workspaces/core
```

### Windows

```txt
H:\Workspaces\core
```

---

## Design Goals

* Platform independent path declarations.
* Deterministic path resolution.
* Eliminate direct dependency on OS-specific filesystem layouts.
* Provide a unified API for all Core-based applications.
* Support custom storage topologies.
* Keep application code independent from path formatting details.
* Avoid reliance on shell-specific environment variable syntaxes.

---

## Possible Approaches

### Approach A - Home Directory Only

Only support:

```txt
relative/path
~/path
```

Pros:

* Extremely simple.
* Covers most application use cases.
* No namespace system required.

Cons:

* Not suitable for advanced storage layouts.
* Does not solve the generic Core problem.

---

### Approach B - Built-in Namespaces

Core provides predefined namespaces:

```txt
{HOME}
{CONFIG}
{DATA}
{CACHE}
{TEMP}
```

Applications build on top of them.

Pros:

* Standardized.
* Portable.
* Easy to understand.

Cons:

* May not cover all use cases.
* Requires predefined filesystem conventions.

---

### Approach C - Fully Declarative Namespaces

Applications define their own namespaces:

```txt
{WORKSPACES}
{PROJECTS}
{CERTIFICATES}
{BACKUPS}
```

Example:

```ts
{
    WORKSPACES: {
        windowsLike: "H:/Workspaces",
        unixLike: "/mnt/workspaces"
    }
}
```

Pros:

* Extremely flexible.
* Fully application driven.
* Supports arbitrary storage layouts.

Cons:

* Requires namespace registration.
* More complex resolver implementation.

---

## Namespace Categories

A future design may separate namespaces into multiple layers.

### Core Namespaces

Provided by Core itself.

Examples:

```txt
{HOME}
{CONFIG}
{DATA}
{CACHE}
{TEMP}
```

### Application Namespaces

Provided by the consuming application.

Examples:

```txt
{WORKSPACES}
{PROJECTS}
{PLUGINS}
```

### System Namespaces

Potential future feature.

Examples:

```txt
{NGINX_CONFIG}
{SYSTEM_LOGS}
```

Used for tools interacting with operating system resources.

---

## Runtime Platform Resolution

Current thinking suggests reducing platform differences into families.

```txt
windowsLike
unixLike
```

Runtime platforms would resolve to one of those families:

```txt
win32    -> windowsLike
linux    -> unixLike
darwin   -> unixLike
freebsd  -> unixLike
openbsd  -> unixLike
netbsd   -> unixLike
```

This avoids maintaining per-platform path definitions when no filesystem difference exists.

---

## Relationship With Environment Variables

One possible direction is to completely forbid environment variable syntax inside filesystem declarations.

Examples that may become invalid:

```txt
${HOME}
$HOME
%APPDATA%
%USERPROFILE%
```

Instead, applications would exclusively use namespace syntax:

```txt
{HOME}
{CONFIG}
{WORKSPACES}
```

This would make filesystem declarations deterministic and independent from shell semantics.

---

## Open Questions

* Should namespaces be mandatory for all Core filesystem operations?
* Should absolute paths be allowed at all?
* Should Core expose filesystem helper APIs directly?
* Should namespace declarations support nesting?
* How should namespace conflicts be resolved?
* Should applications be allowed to override built-in namespaces?
* Should namespace values support runtime interpolation?
* How should system-specific resources be represented?

---

## Long-Term Vision

Provide a filesystem abstraction layer that offers the same level of portability and determinism that Core already provides for:

* Events
* States
* Runtime hooks
* Internationalization

Applications should express filesystem intent, while Core remains responsible for platform-specific resolution and normalization.
