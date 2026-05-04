# RFC — External Contributions Governance & Project Opening

## Status

Proposed (Post v0.2)

---

## Context

The project is currently in an early stabilization phase (v0.x), with ongoing structural work on:

* core architecture
* event system
* runtime invariants
* internal design consistency

Opening the project to external contributions too early would introduce risks:

* architectural drift
* low-quality or misaligned pull requests
* noise from automated agents or unfiltered contributions
* increased maintenance overhead

At the same time, the project aims to be open source and encourage external feedback and ideas.

---

## Problem

A balance must be established between:

* openness (community interaction, ideas, feedback)
* control (architecture integrity, decision authority)

Without clear governance:

* contributions may conflict with core design principles
* maintainers may be overwhelmed by irrelevant PRs
* project direction may become inconsistent

---

## Goals

* Allow open discussion and feedback from the community
* Preserve strict control over implementation and architecture
* Prevent low-signal contributions (spam, AI-generated PRs, misaligned changes)
* Establish a scalable contribution model for future growth
* Prepare the project for safe public opening after stabilization

---

## Proposal

### 1. Two-Level Contribution Model

The project defines two contribution entry points:

#### Public (Open to Everyone)

* Issues
* RFC discussions

#### Restricted (Maintainers Only)

* Pull Requests (initially)
* Code implementation
* Final architectural decisions

---

### 2. Issue-Based Contribution

External contributors are encouraged to:

* report bugs
* suggest improvements
* propose features
* raise questions

Issues serve as the primary interaction layer.

---

### 3. RFC-Based Contributions

For any structural or architectural change:

* contributors must create an RFC
* discussion occurs before implementation
* maintainers validate or reject the proposal

RFCs act as the gateway for major changes.

---

### 4. Pull Request Policy (Initial Phase)

During early versions (v0.x):

* Pull Requests are restricted to maintainers
* External PRs may be:

  * ignored
  * closed
  * or redirected to Issues/RFCs

This ensures:

* architectural consistency
* controlled evolution of the core

---

### 5. Future Evolution

After stabilization (target: post v0.2):

* selective opening of Pull Requests
* contributor onboarding (manual or via trust model)
* potential introduction of:

  * contributor guidelines
  * review processes
  * CLA (Contributor License Agreement)

---

### 6. Contribution Philosophy

The project prioritizes:

* deterministic behavior
* strict architecture
* long-term maintainability

Contributions must align with these principles.

Technical correctness alone is not sufficient for acceptance.

---

## Non-Goals

* Full open contribution model at early stages
* Accepting all external Pull Requests
* Delegating architectural decisions to the community

---

## Risks

* Reduced initial contributor engagement
* Perception of “closed” project despite being open source

---

## Mitigations

* Clear communication in documentation
* Active response to Issues and RFCs
* Transparent decision-making

---

## Migration Plan

1. Keep current closed PR model during v0.x
2. Introduce CONTRIBUTING.md based on this RFC
3. Monitor community interaction (Issues / RFCs)
4. Evaluate readiness for opening PRs post v0.2
5. Gradually introduce contribution tiers

---

## Conclusion

This RFC defines a controlled contribution model that preserves the integrity of the project while enabling community interaction.

It ensures that the project remains open in discussion, but deliberate in execution.

This balance is critical during early-stage development and will evolve as the project matures.
