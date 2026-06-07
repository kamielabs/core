# TEST_PLAN.md

## Purpose

This document defines the testing strategy for the Core runtime.

The goal of v0.1 is not to achieve exhaustive coverage but to validate the stability of the runtime architecture, parser behavior, help routing, event handling and integration flows before the first public release candidate.

Tests are intentionally focused on runtime behavior and integration scenarios.

Unit tests will be introduced after the post-v0.1 refactors (partial contexts, createTest helpers and service isolation).

---

## Current Status

Version: v0.1-rc.1

Status: Active

Coverage Philosophy:

* Runtime-first validation
* Happy paths and error paths
* Public behavior before internal implementation
* Real CLI execution
* Snapshot and output validation
* Regression detection during refactors

---

## Implemented Test Suites

### 00000.sanity.test.ts

Purpose:

Basic testing infrastructure validation.

Covered:

* Vitest execution
* Test environment sanity check

---

### 00001.integration-happy-1.test.ts

Purpose:

Validate successful runtime execution.

Covered:

* Module execution
* Action execution
* Runtime hooks execution
* CLI startup flow

---

### 00002.integration-errors-1.test.ts

Purpose:

Validate runtime behavior around environment loading.

Covered:

* Environment file loading
* Runtime initialization with custom stage defaults
* Terminal error handling
* process.exit interception

---

### 00003.usage-errors-1.test.ts

Purpose:

Validate parser error routing.

Covered:

* Unknown global flag
* Unknown module
* Unknown module flag
* Unknown action
* Unknown action flag

Validated Outputs:

* Error messages
* Usage routing
* Exit codes

---

### 00004.help-module-routes-happy-1.test.ts

Purpose:

Validate all supported help routes.

Covered:

### Global Help

* Standard help
* Full help

### Stage Help

* Stage options listing
* Stage option details

### Global Options

* Global options listing
* Global option details
* Global option lookup by flag
* Global option lookup by environment variable

### Modules

* Modules listing
* Default action help
* Default action flag help
* Module help
* Action help

---

### 00005.help-module-routes-errors-1.test.ts

Purpose:

Validate all help routing error paths.

Covered:

* Unknown stage environment variable
* Unknown global option
* Unknown module
* Unsupported named action on default-action module
* Unknown action
* Unknown module flag
* Unknown action flag

Validated Outputs:

* Error messages
* Help usages
* Exit codes

---

### Coverage Summary

Current RC coverage validates:

* Runtime startup
* Runtime shutdown
* Environment loading
* Module execution
* Action execution
* Parser routing
* Help routing
* Error routing
* Usage routing
* Terminal events
* Exit handling

Current focus is runtime behavior.

Internal implementation details are intentionally not tested yet.

---

## Deferred Runtime Tests

The following runtime tests are planned but intentionally postponed.

### Parser Fine-Grained Validation

Coverage:

* Short flag grouping
* Combined short flags
* Value flags
* Canonical name resolution
* Alias resolution
* Parser edge cases

Examples:

* -abc
* -a=value
* --flag=value

---

### Runtime Phase Hooks

Coverage:

* beforeRuntime
* afterRuntime
* beforeParser
* afterParser
* beforeExecution
* afterExecution

Goal:

Validate complete runtime lifecycle ordering.

---

### Event System Validation

Coverage:

* Signal events
* Message events
* Terminal events
* Warning events
* Event propagation

Goal:

Validate all event categories and runtime behaviors.

---

### Snapshot Validation

Coverage:

* Runtime snapshots
* Indexes
* Built structures
* Lookup dictionaries

Goal:

Ensure snapshot integrity during future refactors.

---

## Future Unit Testing Strategy

Unit testing is intentionally deferred until post-v0.1.

Reason:

Several internal services are expected to evolve during the next iteration.

Introducing extensive unit tests now would generate unnecessary maintenance overhead.

---

### Planned Prerequisites

#### createTest()

Generic testing framework for runtime services.

Goals:

* Reduced boilerplate
* Faster test authoring
* Shared assertions
* Shared setup logic

---

#### Partial Contexts

Services should receive minimal context contracts.

Benefits:

* Easier mocking
* Better isolation
* Reduced dependencies
* Cleaner service testing

---

### Planned Unit Test Targets

#### ParserManager

Coverage:

* Route resolution
* Flag resolution
* Alias resolution
* Validation rules

#### EventsManager

Coverage:

* Event creation
* Event propagation
* Terminal events
* Runtime integration

#### SnapshotService

Coverage:

* Snapshot generation
* Index generation
* Internal consistency

#### RuntimeService

Coverage:

* Runtime lifecycle
* Hook execution
* Phase transitions

#### HelpManager

Coverage:

* Help route resolution
* Usage generation
* Error routes

---

## Test Philosophy

The objective is not to maximize the number of tests.

The objective is to maximize confidence in the runtime.

Tests should validate contracts.

Tests should not dictate implementation.

Whenever possible:

* Test behavior
* Test outputs
* Test public APIs

Avoid coupling tests to internal implementation details.

---

## Release Criteria

v0.1-rc.1

Requirements:

* All implemented tests green
* TypeScript validation green
* Lint validation green
* Runtime manually validated

Command:

pnpm check

Expected Result:

All checks pass successfully.

---

## Notes

Additional tests will be added continuously as new features, regressions or edge cases are discovered through real-world usage in WSC and future KamieLabs projects.

This document represents the baseline testing strategy for the first Core release candidate.
