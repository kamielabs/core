# 🧱 ApiService

## Description

`ApiService` est le service qui expose l’API développeur du core.

Il constitue la façade officielle permettant de déclarer des hooks et d’interagir avec le runtime de manière contrôlée.

En pratique, il est directement utilisé derrière l’appel :

```ts
cli.hooks(...)
```

Son rôle est de fournir une interface claire, typée et stable pour :

* enregistrer des hooks
* interagir avec certaines briques du core
* configurer certains comportements runtime

Il ne contient aucune logique métier propre : il délègue entièrement aux managers.

---

## But

Le `ApiService` sert à exposer une API propre et maîtrisée pour les développeurs utilisant le core.

Il permet de :

* masquer la complexité interne des managers
* garantir un point d’entrée unique pour les hooks
* assurer un typage strict des interactions
* éviter l’accès direct aux composants internes du core

Son objectif est simple :

> offrir une API ergonomique sans compromettre les invariants du core.

---

## Pourquoi ce service existe

Les managers du core sont puissants, mais :

* complexes
* fortement typés
* sensibles aux invariants internes

Les exposer directement au développeur serait dangereux :

* risque de casser le runtime
* risque de comportements non déterministes
* perte de contrôle sur l’architecture

`ApiService` existe donc pour jouer un rôle de **couche d’abstraction** :

* il expose uniquement ce qui est autorisé
* il contrôle les points d’entrée
* il maintient la cohérence du système

---

## Portée

En v0.1, `ApiService` est responsable de :

* exposer les méthodes d’enregistrement de hooks
* rediriger les appels vers les managers concernés
* maintenir un typage strict des interactions
* servir de point d’entrée unique pour les hooks

Il ne fait pas :

* de logique métier
* de résolution runtime
* de transformation de données
* de validation avancée
* de gestion d’état

Il agit uniquement comme un proxy contrôlé.

---

## Principe de fonctionnement

Chaque méthode exposée par `ApiService` correspond directement à une capacité d’un manager.

Le service :

1. reçoit un appel développeur
2. applique le typage attendu
3. délègue immédiatement au manager concerné

Exemple typique :

```ts
api.onModule("user", hook)
```

→ redirigé vers :

```ts
ctx.modules.registerCustomModuleHook(...)
```

Ce design garantit :

* aucune duplication de logique
* une surface d’API maîtrisée
* une séparation nette entre API publique et implémentation interne

---

## Hooks exposés

`ApiService` expose plusieurs méthodes de hooking.

---

### Stages

#### Définition des valeurs par défaut

Permet de surcharger certaines valeurs du stage builtin par défaut.

```ts
setBuiltinStageDefaults(...)
```

---

#### Hook sur un stage builtin

```ts
onBuiltinStage(stage, hook)
```

---

#### Hook sur un stage custom

```ts
onCustomStage(stage, hook)
```

---

### Globals

#### Hook global

```ts
onGlobals(hook)
```

Permet d’interagir avec les globals résolus.

---

### Modules

#### Hook de module

```ts
onModule(module, hook)
```

Permet d’interagir avec les options d’un module.

---

#### Hook d’action

```ts
onModuleAction(module, action, hook)
```

Permet de définir l’exécution réelle d’une action.

C’est le point d’entrée principal du code métier.

---

## Typage

Le service est fortement typé grâce aux génériques du core.

Cela permet :

* d’avoir des hooks strictement typés selon le module/action ciblé
* de garantir la cohérence entre déclaration et runtime
* d’éviter les erreurs d’usage dès la compilation

Le typage est une des forces majeures de cette API.

---

## Relation avec `cli.hooks()`

`ApiService` est la couche technique derrière la méthode exposée au développeur.

Autrement dit :

```ts
cli.hooks().onModule(...)
```

Le développeur accède à `ApiService` via la méthode `cli.hooks()`, qui retourne une interface contrôlée exposant uniquement les méthodes autorisées.

Cela permet :

* de limiter l’exposition de l’API
* de contrôler le moment d’exécution
* de garantir que les hooks sont déclarés au bon moment du lifecycle

---

## Rationalité

Le design de `ApiService` repose sur un principe simple :

> le développeur ne doit jamais manipuler directement les managers internes.

Cela permet :

* de préserver les invariants du core
* de limiter les effets de bord
* de maintenir une API stable
* de faire évoluer les managers sans casser l’API publique

C’est une couche de sécurité autant qu’une couche ergonomique.

---

## Relations

### Avec les managers

`ApiService` délègue directement aux managers :

* `StagesManager`
* `GlobalsManager`
* `ModulesManager`

Il ne contient aucune logique propre.

---

### Avec le développeur

C’est le seul point d’entrée officiel pour :

* déclarer des hooks
* configurer le comportement du runtime

---

### Avec le lifecycle

Les hooks enregistrés via `ApiService` seront exécutés plus tard, dans les phases appropriées du runtime.

Le service ne contrôle pas leur exécution, seulement leur enregistrement.

---

## Limitations actuelles

En v0.1 :

* L’ensemble des méthodes exposées en v0.1 est considéré comme stable dans son périmètre actuel.
* les noms des méthodes pourront évoluer pour améliorer la lisibilité
* aucune gestion des plugins n’est encore exposée
* la surface API reste volontairement limitée

Ces limitations sont cohérentes avec l’objectif de stabilité de la v0.1.

---

## Évolutions futures

Les évolutions prévues incluent :

* amélioration des noms et de l’ergonomie de l’API
* ajout de nouveaux points d’extension (ex: plugins)
* enrichissement des capacités de hooking
* meilleure structuration des APIs par domaine

L’objectif est de faire évoluer cette API sans jamais exposer directement la complexité interne du core.

---

## Conclusion

`ApiService` est la porte d’entrée du développeur dans le core.

Il ne fait qu’une chose :

> exposer de manière contrôlée les capacités du système.

C’est une couche volontairement simple, mais essentielle pour garantir :

* une bonne expérience développeur
* une API stable
* une architecture propre

---
