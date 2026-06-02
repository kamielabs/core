# Flag Declaration Validation

## Current issue

Flag declarations are currently not normalized nor validated strictly enough.

## Invalid cases currently accepted

### Long flags

Developer can declare:

```txt
--help
---help
----help
-a
--
```

while only:

```txt
help
version
module-name
```

should be accepted in declarations.

The runtime should generate the leading `--` itself.

### Short flags

Developer can declare:

```txt
-a
-ab
-abc
--
```

while only a single alphanumeric character should be accepted:

```txt
h
v
m
```

## Expected validation

Long flag:

```regex
^[a-zA-Z0-9][a-zA-Z0-9-]+$
```

with minimum 2 alphanumeric characters overall.

Short flag:

```regex
^[a-zA-Z0-9]$
```

exactly one character.

## Priority

Post v0.1

## Impact

Low

Does not affect runtime execution.
Affects declaration consistency and API cleanliness.

---
