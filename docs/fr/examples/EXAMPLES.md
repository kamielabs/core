# Exemples

Ce document présente les façons minimales et les plus courantes d’utiliser le core CLI.

> Ces exemples reflètent la philosophie du core :
> configuration minimale, comportement déterministe, aucune magie cachée.

---

`⚠️ Avertissement` :
> Les identifiants internes tels que `__defaultModule__` et `__singleAction__`
> font partie du modèle interne du core.
> Une couche DX de plus haut niveau fournira une API plus ergonomique, ce document sera mis à jour en conséquence.

---

## 1. CLI minimal (sans configuration)

Le CLI fonctionne immédiatement avec les modules intégrés.

```ts
import { CLI } from "@kamie-oss/core";

const cli = CLI.init();

async function main() {
  await cli.run();
}

main();
````

### Modules disponibles

```bash
$ cli --help

MODULES
  help
  version
```

---

## 2. Mode modules (par défaut)

Définissez un ou plusieurs modules avec des actions.

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

### Utilisation

```bash
$ cli user create
User created
```

---

## 3. Mode action unique

Définissez un module par défaut avec une seule action.

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

### Utilisation

```bash
$ cli
Hello from single action
```

---

## Règles

* `modules` et `__defaultModule__` ne peuvent pas être utilisés ensemble
* un module ne peut pas définir à la fois `actions` et `__defaultAction__`
* `__singleAction__` est uniquement autorisé dans `__defaultModule__`

---

## Notes

* Les modules intégrés (`help`, `version`) sont toujours disponibles
* Le CLI est entièrement fonctionnel sans aucune configuration
* `cli.run()` est asynchrone et doit toujours être attendu
* Les hooks peuvent être synchrones ou asynchrones
* **Les hooks doivent être enregistrés après CLI.init() et avant cli.run().**
