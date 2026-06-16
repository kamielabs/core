# Git Workflow

Status: Idea
Priority: Low
Trigger:

* Multiple consumer projects
* Need for integration branch
* First breaking change impacting consumers

## Purpose

This workflow defines the official branching, validation and release strategy used across all KamieLabs projects.

Its goals are:

* Keep `main` permanently stable.
* Allow long integration cycles without impacting production.
* Validate changes using real consumer projects before release.
* Provide a deterministic path from RFC to release.

---

## Branches

### main

The production branch.

Rules:

* Must always be stable.
* Must always be releasable.
* Receives changes only from `next`.
* Release tags are created from this branch.

Examples:

```text
v0.1.0
v0.1.1
v0.2.0
```

---

### next

The integration branch.

Rules:

* Represents the future state of `main`.
* Receives validated pull requests from `feature/*`.
* May contain unfinished release work.
* May contain breaking changes.
* Used for integration testing across dependent projects.

Examples:

```text
core#next
wsc#next
```

---

### feature/*

Development branches.

Examples:

```text
feature/parser-v3
feature/i18n-static
feature/helper-cache
feature/runtime-refactor
```

Rules:

* Created from `next`.
* Dedicated to a single RFC, feature or fix.
* Merged through Pull Requests only.
* Never released directly.
* Never receive release tags.

---

## Development Flow

```text
feature/*
      ↓
     PR
      ↓
    next
      ↓
integration tests
      ↓
     RC
      ↓
consumer validation
      ↓
    main
      ↓
release
```

---

## RFC Lifecycle

A feature begins with an RFC.

States:

```text
draft
review
approved
implemented
released
```

Rules:

* An RFC must be approved before implementation.
* A feature branch should reference its RFC.
* An RFC becomes implemented when merged into `next`.
* An RFC becomes released when the corresponding release reaches `main`.

---

## Release Candidates

Release candidates are created from `next`.

Examples:

```text
v0.2.0-rc.1
v0.2.0-rc.2
v0.2.0-rc.3
```

Purpose:

* Stabilization.
* Integration validation.
* Consumer project testing.
* Regression testing.

---

## Consumer Validation

A release candidate is not considered validated until it has been tested by at least one real consumer project.

Examples:

```text
core
 └── tested by wsc

wsc
 └── tested by kloud services
```

Consumer validation is preferred over isolated unit testing because it validates real integration scenarios.

---

## Release Process

Once an RC has been validated:

```text
next
  ↓
merge
  ↓
main
  ↓
tag release
```

Example:

```text
next
  ↓
main
  ↓
v0.2.0
```

---

## Invariants

The following rules are considered mandatory:

* `main` must remain stable.
* Releases must originate from `main`.
* Features must be developed in `feature/*`.
* Pull Requests are required for merges.
* RFC approval is required before implementation.
* RC validation must occur before release.
* Real consumer projects are the primary validation mechanism.
* Direct development on `main` is forbidden.
* Direct releases from `feature/*` are forbidden.
