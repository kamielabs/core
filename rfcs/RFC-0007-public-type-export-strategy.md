# RFC-0007 Public Type Export Strategy

## Status

Proposed

## Context

While integrating Core into WSC, several TypeScript errors revealed that some runtime types used by the public API are not exported through the package entrypoint.

Example:

```ts
export const cli = CLI.init({...});
```

may trigger errors such as:

```txt
Exported variable 'cli' has or is using name 'CoreEventKind' but cannot be named.
```

The issue appears when consumer projects re-export Core runtime objects.

## Problem

Core currently exposes runtime classes through the package entrypoint.

However, many types used by these public classes remain internal and are not explicitly exported.

As a result, TypeScript cannot always generate valid declarations for consumers.

## Goals

* Define a stable public TypeScript API.
* Separate internal and public type contracts.
* Keep the generated `index.ts` architecture unchanged.
* Allow consumer projects to export and share typed Core instances.
* Support advanced generic inference provided by `CLI.init()`.

## Non Goals

* Export all internal Core types.
* Expose implementation details of managers, services or providers.
* Modify the generated index strategy.

## Decision

Introduce a dedicated file:

```txt
ts/publicTypes.ts
```

This file becomes the official declaration point for public TypeScript contracts.

The generated package entrypoint will automatically re-export these public types.

Example:

```ts
export type * from "./publicTypes";
```

## Public API Principles

A type should be exported if:

* it appears in the public type signature of `CLI`
* it appears in `CLI.init()`
* it appears in `cli.run()`
* it appears in `cli.hooks()`
* it appears in public snapshots or public contracts

A type should remain internal if:

* it is implementation-specific
* it is only consumed by internal services
* it is only consumed by internal managers

## Initial Categories

* Events
* Runtime
* Options
* Modules
* Snapshots
* Configuration

## Migration Strategy

1. Use WSC as the reference consumer.
2. Export missing categories incrementally.
3. Build the complete public type inventory.
4. Deliver through v0.1.0-rc.2.

## Expected Benefits

* Stable public TypeScript API.
* Clear separation between internal and public contracts.
* Better support for multi-file CLI definitions.
* Foundation for future plugin architecture.
