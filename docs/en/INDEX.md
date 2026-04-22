# 📚 Core Documentation Index

This document provides a structured entry point to the entire Core documentation.

---

## 🚀 Getting Started

- This project is a pnpm workspace-based project

- Installation

  - pnpm

  ```bash
  # Coming soon
  npm install @kamie-oss/core

  - from git sources (warning: the version may be unstable and under development)

  ```bash
  git clone https://github.com/kamielabs/core
  cd core
  pnpm install
  pnpm build
  # output in projects/core/dist
  ```

- Basic usage

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
    console.log('User created 👤')
})

async function main() {
    await cli.run();
}

main()
```

---

## 📦 Examples

- [EXAMPLES](./examples/EXAMPLES)

---

## 🧱 Core Rules

- [AI_USAGE](./AI_USAGE)
- [DEPENDENCIES](./DEPENDENCIES.md)
- [DESIGN_PRINCIPLES](./DESIGN_PRINCIPLES)
- [DOCS_POLICY](./DOCS_POLICY)

---

## 🏗️ Core Architecture

- [LIFECYCLE](./arch/LIFECYCLE)
- [ENGINES](./arch/ENGINES)
- [HOOKING] -> TODO
- [CORE_STATES] -> TODO

---

## ⚙️ Internal Components

### Concepts

#### 🔧 Service

A service is a cross-cutting abstraction that exposes capabilities (API, tools, data access) without directly participating in runtime construction.

- no structured lifecycle
- no phase
- no responsibility for core validity

#### ⚙️ Manager

A manager is a fundamental core building block responsible for declaring, resolving, or maintaining a part of the runtime.

- may expose a DSL
- may resolve data
- may maintain runtime state
- integrated into the core lifecycle (phases, orchestration)

#### 🔥 Absolute Rule

> Everything that builds or guarantees the runtime = Manager
> Everything that assists or exposes = Service

### Components List

#### Services

- [Dev API](./arch/components/ApiService) — Centralized development interface
- [Snapshot API](./arch/components/SnapshotService) — Centralized interface for core declarations
- [Tools API](./arch/components/ToolsService) — Interface for tools exposed to the developer
- [Core Console](./arch/components/CoreConsoleService) — Internal core console

#### 🔷 Special Service: Runtime

- [Runtime API](./arch/components/RuntimeService) — Interface of the constructed runtime & runtime orchestrator ensuring consistency

#### Managers

- [Events](./arch/components/EventsManager) — Core event system
- [I18N](./arch/components/I18nManager) — Internationalization system
- [Meta](./arch/components/MetaManager) — Management of non-translatable data
- [Bootstrap](./arch/components/BootstrapManager) — Execution environment management
- [Stages](./arch/components/StagesManager) — Execution profiles management
- [Parser](./arch/components/ParserManager) — CLI parsing management
- [Globals](./arch/components/GlobalsManager) — Global options management
- [Modules](./arch/components/ModulesManager) — Module/action system management

---

## 🧪 Tests

- [TEST_PLAN] -> TODO
