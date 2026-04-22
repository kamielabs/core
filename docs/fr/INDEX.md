# 📚 Index de la documentation du Core

Ce document fournit un point d’entrée structuré vers l’ensemble de la documentation du Core.

---

## 🚀 Prise en main

- Ce projet est un projet sous workspace pnpm

- Installation
  - npm

  ```bash
  # Coming soon
  npm install @kamie-oss/core
  ```

  - depuis les sources git (attention la version peut-être cassée et en cours de dev)

  ```bash
  git clone https://github.com/kamielabs/core
  cd core
  pnpm install
  pnpm build
  # output in projects/core/dist
  ```

- Utilisation de base

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

## 📦 Exemples

- [EXAMPLES](./examples/EXAMPLES.md)

---

## 🧱 Règles du Core

- [AI_USAGE](./AI_USAGE.md)
- [DEPENDENCIES](./DEPENDENCIES.md)
- [DESIGN_PRINCIPLES](./design/DESIGN_PRINCIPLES.md)
- [DOCS_POLICY](./DOCS_POLICY.md)

---

## 🏗️ Architecture du Core

- [LIFECYCLE](./arch/LIFECYCLE.md)
- [ENGINES](./arch/ENGINES.md)
- [HOOKING] -> TODO
- [CORE_STATES] -> TODO

---

## ⚙️ Composants internes

### Concepts

#### 🔧 Service

Un service est une abstraction transverse qui expose des capacités (API, outils, accès aux données) sans participer directement à la construction du runtime.

- pas de cycle de vie structuré
- pas de phase
- pas de responsabilité sur la validité du core

#### ⚙️ Manager

Un manager est une brique fondamentale du core responsable de la déclaration, de la résolution ou du maintien d’une partie du runtime.

- peut exposer un DSL
- peut résoudre des données
- peut maintenir un état runtime
- intégré dans le cycle de vie du core (phases, orchestration)

#### 🔥 Règle absolue

> Tout ce qui construit ou garantit le runtime = Manager
> Tout ce qui aide ou expose = Service

### Liste des composants

#### Services

- [Dev API](./arch/components/ApiService.md) — Interface centralisée pour le développement
- [Snapshot API](./arch/components/SnapshotService.md) — Interface centralisée des déclarations du core
- [Tools API](./arch/components/ToolsService.md) — Interface des outils exposés au développeur
- [Core Console](./arch/components/CoreConsoleService.md) — Console interne du core

#### 🔷 Service spécial : Runtime

- [Runtime API](./arch/components/RuntimeService.md) — Interface du runtime construit & Orchestrateur du runtime et garant de sa cohérence

#### Managers

- [Events](./arch/components/EventsManager.md) — Système d’événements du core
- [I18N](./arch/components/I18nManager.md) — Système d’internationalisation
- [Meta](./arch/components/MetaManager.md) — Gestion des données non traduisibles
- [Bootstrap](./arch/components/BootstrapManager.md) — Gestion de l’environnement d’exécution
- [Stages](./arch/components/StagesManager.md) — Gestion des profils d’exécution
- [Parser](./arch/components/ParserManager.md) — Gestion du parsing CLI
- [Globals](./arch/components/GlobalsManager.md) — Gestion des options globales
- [Modules](./arch/components/ModulesManager.md) — Gestion du système module/action

---

## 🧪 Tests

- [TEST_PLAN] -> TODO
