# Public Type Export Strategy

## Summary

While integrating Core into WSC, TypeScript revealed that several public runtime types are currently not exported through the package entrypoint.

Example:

```ts
export const cli = CLI.init({});
```

may produce errors such as:

```txt
Exported variable 'cli' has or is using name 'CoreEventKind' ...
but cannot be named.
```

## Root Cause

Core exposes runtime classes and APIs that internally rely on many strongly typed contracts.

However, not all of those types are currently exported through the public package API.

As a result, TypeScript cannot always generate valid declarations when a consumer project re-exports Core runtime objects.

## Current Workaround

Manually export the required types through the package entrypoint while integrating WSC.

This allows real-world validation of which types are actually required by consumers.

## Planned Resolution

Define a dedicated public type export strategy.

Potential goals:

* Expose only consumer-facing types
* Avoid exporting internal implementation details
* Group exports by category
* Maintain a stable public TypeScript API

Possible categories:

* Events
* Runtime
* Modules
* Options
* Configuration
* Snapshots

## Status

* Non-blocking
* Runtime unaffected
* Packaging / TypeScript API issue

## Discovered During

* WSC integration
* Core package consumption
* RC1 validation
