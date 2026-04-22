# 🧱 ToolsService

## Description

`ToolsService` est le service chargé d’exposer les outils autorisés dans les hooks du core.

Il fournit des ensembles de fonctions (appelées *tools*) adaptés à chaque contexte d’exécution :

* stage
* globals
* module
* action

Ces tools permettent au développeur d’interagir avec le runtime de manière contrôlée, sans accéder directement aux managers internes.

> Les noms exposés via ToolsService ne reflètent pas nécessairement les méthodes internes du core. Ils sont conçus pour offrir une API simple et cohérente côté développeur (DX).

---

## But

Le `ToolsService` sert à fournir une interface sécurisée pour effectuer certaines actions depuis les hooks.

Il permet notamment :

* d’émettre des événements (`signal`, `message`)
* d’interagir avec certains aspects du runtime
* d’ajouter des listeners runtime
* (plus tard) de modifier certains paramètres contrôlés du runtime

Son objectif est clair :

> exposer des capacités utiles sans permettre de casser les invariants du core.

---

## Pourquoi ce service existe

Les hooks sont des points d’entrée puissants dans le runtime.

Sans contrôle, ils pourraient :

* modifier des données critiques
* casser la cohérence du runtime
* introduire des comportements non déterministes

`ToolsService` existe donc pour :

* limiter ce que les hooks peuvent faire
* adapter les capacités selon la phase du runtime
* garantir une mutation strictement contrôlée
* éviter tout accès direct aux managers

C’est une couche de sécurité autant qu’une couche d’API.

---

## Principe de fonctionnement

Le service expose différentes méthodes qui retournent un objet de tools selon le contexte.

Exemple :

```ts
tools: this.ctx.tools.stageContext()
```

Chaque contexte fournit un sous-ensemble spécifique de capacités.

---

## Contextes disponibles

### Stage

```ts
stageContext()
```

Tools disponibles :

* `signal()`
* `setCwd()` (placeholder en v0.1)

Ce contexte est volontairement très limité.

À ce stade :

* le runtime n’est pas encore complet
* seules des mutations très contrôlées sont autorisées

---

### Globals

```ts
globalsContext()
```

Tools disponibles :

* `signal()`
* `message()`
* `addListener()`

Ce contexte permet :

* d’émettre des événements
* d’ajouter des listeners runtime

L’i18n étant disponible à ce stade, les `message` sont autorisés.

---

### Module

```ts
moduleContext()
```

Tools disponibles :

* `signal()`
* `message()`

Le runtime est presque finalisé, mais reste partiellement mutable.

Les capacités sont volontairement limitées.

---

### Action

```ts
actionContext()
```

Tools disponibles :

* `signal()`
* `message()`

À ce stade :

* le runtime est figé
* on est dans l’exécution métier

Aucune mutation structurelle n’est autorisée.

---

## Émission d’événements

Les tools principaux sont :

### `signal()`

Permet d’émettre un événement de type `signal`.

```ts
tools.signal("mySignal", { details: [...] })
```

---

### `message()`

Permet d’émettre un événement de type `message`.

```ts
tools.message("myMessage", { values: {...} })
```

---

### Restriction importante

Les tools n’autorisent que l’émission :

* de **custom events**

Les événements internes du core restent protégés.

---

## Ajout de listeners

Dans le contexte globals :

```ts
addListener(handler)
```

Permet d’ajouter un listener runtime sur le channel par défaut.

Cela permet par exemple :

* de rediriger l’output
* d’ajouter un logger custom
* de brancher un système externe

---

## `setCwd()` (prévu)

Le tool `setCwd()` est prévu pour permettre une mutation contrôlée du répertoire de travail.

Cas d’usage typique :

* sandbox
* isolation d’environnement
* redirection de workspace

En v0.1 :

* la méthode est présente
* mais non encore implémentée

Ce choix est volontaire :

> elle sera validée par des cas réels avant d’être finalisée.

---

## Séparation des capacités

Un point fondamental du design :

> tous les hooks n’ont pas accès aux mêmes tools.

Pourquoi ?

Parce que chaque phase du runtime a ses contraintes :

* stage → environnement en construction
* globals → configuration en cours
* module → transition vers exécution
* action → runtime figé

Cette séparation permet :

* de réduire les risques
* de garder un runtime déterministe
* de contrôler précisément les points d’entrée

---

## Rationalité

Le design de `ToolsService` repose sur un principe clé :

> un hook ne doit jamais avoir plus de pouvoir que nécessaire.

Cela permet :

* de sécuriser le runtime
* de limiter les effets de bord
* de garder une architecture prévisible
* de faciliter le raisonnement sur le système

C’est une approche par **capabilities**, plutôt que par accès global.

---

## Relations

### Avec `EventsManager`

Les tools `signal()` et `message()` délèguent directement à `EventsManager`.

---

### Avec `RuntimeService`

Certains tools (comme `setCwd()` à terme) interagiront avec le runtime via des mutations contrôlées.

---

### Avec les hooks

Le service est utilisé exclusivement dans les hooks, via le contexte :

```ts
tools: this.ctx.tools.*
```

---

### Avec les plugins (futur)

Le service est destiné à devenir le point d’injection des tools fournis par des plugins.

---

## Limitations actuelles

En v0.1 :

* `setCwd()` n’est pas encore implémenté
* les tools disponibles sont volontairement limités
* aucun système de plugins n’est encore connecté
* les capacités sont fixes et non extensibles

Ces limitations sont cohérentes avec une première version stable.

---

## Évolutions futures

Les évolutions prévues incluent :

* implémentation complète de `setCwd()`
* ajout de nouveaux tools
* intégration avec un système de plugins
* extension dynamique des capacités
* raffinement du modèle de sécurité

---

## Conclusion

`ToolsService` est la brique qui donne du pouvoir aux hooks, sans compromettre la stabilité du core.

Il applique une règle simple :

> exposer uniquement ce qui est nécessaire, au moment où c’est nécessaire.

C’est cette approche qui permet au core d’être à la fois :

* extensible
* sécurisé
* déterministe

---
