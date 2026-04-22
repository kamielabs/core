# Examples

This document shows the minimal and most common ways to use the core CLI.

> These examples reflect the core philosophy:
> minimal setup, deterministic behavior, no hidden magic.

---

`⚠️ Warning`:
> Internal identifiers such as `__defaultModule__` and `__singleAction__`
> are part of the core internal model.
> A higher-level DX layer will provide a more ergonomic API, this doc will be updated consequently.

---

## 1. Minimal CLI (no configuration)

The CLI works out of the box with built-in modules.

```ts
import { CLI } from "@kamie-oss/core";

const cli = CLI.init();

async function main() {
  await cli.run();
}

main();
```

### Available modules

```bash
$ cli --help

MODULES
  help
  version
```

---

## 2. Modules mode (default)

Define one or more modules with actions.

```ts
import { CLI } from "@kamie-oss/core";

const cli = CLI.init({
  modules: {
    user: {
      actions: {
        create: {}
      }
    }
  }
});

cli.hooks().onModuleAction('user', 'create', async () => {
    console.log('User created')
})

async function main() {
    await cli.run();
}

main()
```

### Usage

```bash
$ cli user create
User created
```

---

## 3. Single action mode

Define a default module with a single action.

```ts
import { CLI } from "@kamie-oss/core";

const cli = CLI.init({
  __defaultModule__: {
        singleAction: {
             __singleAction__: {}
        }
    }
  }
});

cli.hooks().onModuleAction('__defaultModule__', '__singleAction__', async () => {
    console.log('Hello from single action')
})

async function main() {
    await cli.run();
}

main()
```

### Usage

```bash
$ cli
Hello from single action
```

---

## Rules

* `modules` and `__defaultModule__` cannot be used together
* a module cannot define both `actions` and `__defaultAction__`
* `__singleAction__` is only allowed in `__defaultModule__`

---

## Notes

* Built-in modules (`help`, `version`) are always available
* The CLI is fully functional without any configuration
* `cli.run()` is asynchronous and should always be awaited
* Hooks can be synchronous or asynchronous
* **Hooks must be registered after CLI.init() and before cli.run().**
