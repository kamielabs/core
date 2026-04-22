# 🧱 ParserManager

## Description

`ParserManager` is the runtime manager responsible for resolving the CLI input using a strictly deterministic strategy.

Its role is to interpret CLI tokens while respecting:

* their position
* the current resolution phase
* the active runtime mode

The parser follows a **strict left-to-right** logic, with no backtracking or reinterpretation.

It is the syntactic component of the core: it does not decide business logic, but transforms CLI input into data usable by other runtime managers.

---

## Purpose

`ParserManager` analyzes the CLI input in a stable, predictable way aligned with the active execution mode.

It allows to:

* resolve global flags
* resolve module and action names
* resolve module and action flags
* isolate remaining arguments
* report parsing inconsistencies without breaking the flow abruptly

Its goal is to provide a reliable syntactic interpretation of the CLI for the runtime.

---

## Why This Manager Exists

The core needs a dedicated component to interpret CLI input.

This responsibility must not be mixed with:

* bootstrap resolution
* stage configuration
* global options resolution
* module or business logic

`ParserManager` isolates parsing logic into a dedicated phase, with strict rules and consistent behavior across all modes.

This ensures:

* deterministic parsing
* simple reasoning model
* stable behavior
* clear separation between CLI syntax and runtime logic

---

## Scope

In v0.1, `ParserManager` is responsible for:

* consuming CLI tokens in order
* resolving flags according to scope
* identifying modules and actions
* separating raw arguments
* respecting phase transitions
* storing parsing context
* reporting anomalies as issues or events depending on runtime state

It does not:

* implement business logic
* resolve environment
* validate business values
* mutate global runtime
* reinterpret tokens after parsing

Its scope is strictly **CLI syntax interpretation**.

---

## Design Choice — Single-Token Flags

The CLI enforces a strict single-token flag model.

Meaning:

* ✅ flags must include their value in the same token (`--flag=value`)
* ❌ multi-token flags (`--flag value`) are intentionally unsupported

This ensures:

* deterministic parsing
* single-pass execution
* no ambiguity
* consistent behavior across all modes

This is a deliberate trade-off favoring predictability over convenience.

---

## Resolution Principles

The parser follows strict deterministic rules:

* tokens are processed strictly left to right
* each token is interpreted based on position
* behavior depends on active mode
* no backtracking or reinterpretation

In other words:

> once a token is consumed in a phase, it is never reprocessed.

---

## Token Handling

The parser treats input as a linear sequence of tokens.

Each token:

* is consumed exactly once
* is interpreted based on the current phase
* is never reassigned retroactively

Interpretation always depends on:

* active phase
* runtime mode

---

## Special Tokens

### `--` (phase separator)

The `--` token acts as a **phase separator**, not a global stop.

---

### Behavior

When `--` is encountered:

* the current parsing phase stops immediately
* the parser moves to the next phase
* parsing continues left to right

---

### Example — Skip global flags

```bash
cli --global -- module action args
````

→ `--` ends global flag phase
→ `module` is interpreted as module name

---

### Example — Force raw arguments

```bash
cli module action -- --arg1 --arg2
```

→ `--` ends action flag phase
→ `--arg1` and `--arg2` are treated as raw arguments

---

### Use Cases

* allow arguments starting with `-`
* explicitly control phase transitions
* avoid ambiguity between flags and arguments

---

### Guarantees

* `--` only affects the current phase
* it never reinterprets previous tokens
* it preserves deterministic parsing

---

## Flag Behavior

### General Rules

* short (`-f`) and long (`--flag`) formats are supported
* each flag must define a long name (used as runtime key)
* flags must be single-token:

  * ✅ `--flag=value`
  * ❌ `--flag value`

---

### Short Flag Grouping

Short flags can be grouped:

```bash
-fab
```

Each character is interpreted as an individual flag.

---

### Flags with Values

If a short flag requires a value:

* it must be the last in the group
* it must appear alone or at the end

Examples:

```bash
# valid
-fab
-fa -b=value
-fb=value

# invalid
-fba=value
```

If grouping rules are violated:

* the entire group is ignored
* parsing continues

---

## Scope Resolution

Flags are assigned based on position:

* before module → global flags
* between module and action → module flags
* after action → action flags

No implicit reassignment occurs.

This guarantees readability and determinism.

---

## Fallback Behavior

The parser must not crash runtime on every invalid token.

In v0.1, fallback may:

* ignore invalid tokens
* continue parsing
* accumulate parsing issues
* emit warnings or events depending on phase maturity

The goal is robustness while preserving traceability.

---

## Execution Modes

Parser behavior depends on runtime mode.

---

### 1. Single Action Mode

```text
1. globalFlags
2. args
```

* no module name expected
* no action name expected
* all non-flag tokens are arguments

---

### 2. Default Action Mode

```text
1. globalFlags
2. moduleName
3. actionFlags
4. args
```

* module defines `defaultAction`
* no explicit action name allowed
* flags after module are action flags

---

### 3. Multiple Actions Mode

```text
1. globalFlags
2. moduleName
3. moduleFlags
4. actionName
5. actionFlags
6. args
```

* module defines multiple actions
* action name is required
* flags before action → module flags
* flags after action → action flags

---

## What This Manager Produces

`ParserManager` produces an intermediate parsing context including:

* parsed globals
* detected module
* module options
* detected action
* action options
* remaining arguments
* parsing issues

This is not business execution—only syntactic truth.

---

## Rationale

The parser design follows a simple idea:

> a serious CLI must be predictable before being convenient.

This is why the core rejects:

* ambiguous multi-token flags
* late reinterpretation
* implicit behaviors that are hard to reason about

This approach enables:

* stability
* simpler flow understanding
* better testability
* stronger typing
* natural integration with phased runtime

---

## Relationships

### With `BootstrapManager`

Indirectly relies on execution context stabilized by bootstrap.

---

### With `StagesManager`

Stage influences runtime context but not parsing logic.

---

### With `GlobalsManager`

Resolves global flags for global value resolution.

---

### With `ModulesManager`

Provides syntactic data for:

* module
* action
* flags
* arguments

---

### With `EventsManager`

Reports anomalies or fallback behaviors via internal mechanisms.

---

## Examples

### Single Action Mode

```bash
cli --verbose arg1 arg2
```

→ `--verbose` = global flag
→ `arg1 arg2` = arguments

---

### Default Action Mode

```bash
cli user --force arg1
```

→ `user` = module
→ `--force` = action flag
→ `arg1` = arguments

---

### Multiple Actions Mode

```bash
cli user --debug create --force arg1
```

→ `user` = module
→ `--debug` = module flag
→ `create` = action
→ `--force` = action flag
→ `arg1` = arguments

---

## Current Limitations

In v0.1, the parser is intentionally strict and minimal.

Known limitations:

* no multi-token flag support
* fallback partially based on internal issues
* behavior still aligning with final event system
* strict token position rules

These align with the core goal: simple, stable, deterministic parsing.

---

## Future Evolutions

Future improvements may include:

* full alignment between parsing issues and runtime events
* improved parsing debug experience
* refined fallback behavior
* better user-facing error messages

The goal remains:

* no magic
* no ambiguity
* no hard-to-reason implicit parsing

---

## Conclusion

`ParserManager` is the syntactic core component.

It does not handle business logic, environment resolution, or execution.

It focuses on one responsibility:

> read the CLI input in a strictly deterministic way.

This deliberate simplicity, combined with clear phase and scope separation, makes it a central piece of the runtime.

---
