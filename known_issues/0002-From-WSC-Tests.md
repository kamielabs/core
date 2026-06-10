# WSC errors, bugs, adjustments, findings

## Full Help display errors

### Actions displayed as modules

In Full Help rendering, actions belonging to a module may be displayed using the same visual structure as modules.

This creates confusion between:

- module entries
- action entries

#### Example

```text
test:
  Type: Multi Actions Module
test
test2
```

Actions test and test2 appear visually as module entries.

#### Expected

Actions should be clearly rendered as actions belonging to their parent module.

#### Status

Non-blocking
Runtime unaffected
Display / UX issue only

#### Discovered during

WSC integration tests
Core package validation

---
