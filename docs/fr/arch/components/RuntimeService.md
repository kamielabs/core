# 🧱 RuntimeService

## Description

`RuntimeService` est le service responsable de la gestion globale du runtime.

Il agit comme :

* orchestrateur des phases d’exécution
* garant de l’ordre de résolution
* conteneur du runtime global
* point d’accès au runtime pour les hooks

Il centralise l’état du runtime et assure sa cohérence tout au long du lifecycle.

---

## But

Le `RuntimeService` a trois objectifs principaux :

* garantir un ordre d’exécution strict du runtime
* fournir un runtime cohérent et accessible aux hooks
* isoler les mutations runtime des données internes des managers

Son rôle peut être résumé simplement :

> orchestrer, sécuriser et exposer le runtime.

---

## Pourquoi ce service existe

Le core repose sur plusieurs managers indépendants :

* bootstrap
* stages
* i18n
* globals
* modules

Mais sans coordination centrale :

* l’ordre d’exécution pourrait être incohérent
* les données pourraient être accédées trop tôt
* les mutations pourraient impacter directement les managers

`RuntimeService` existe pour :

* imposer une séquence d’exécution stricte
* centraliser les données runtime
* garantir l’intégrité du système

---

## 🔒 Nature du runtime

Le runtime suit un modèle strict :

* exécution linéaire
* transitions déterministes
* progression irréversible

Une fois une phase validée :

* elle ne peut pas être rejouée
* elle ne peut pas être rollback
* elle ne peut pas être modifiée

> Le runtime avance toujours vers l’état final (ready), sans retour arrière.

Ce choix est volontaire afin de garantir :

* simplicité
* prédictibilité
* facilité de debugging

---

## Orchestration du runtime

Le runtime est construit étape par étape via des méthodes explicites :

```ts
setInit()
setBootstrap()
setStage()
setGlobals()
setAction()
setReady()
```

Chaque étape :

* déclenche la résolution d’un manager
* met à jour l’état interne
* enrichit le runtime global
* émet des événements

---

## Ordre d’exécution

Le runtime suit une séquence stricte :

```text
init → bootstrap → stage → i18n → globals → module → ready
```

Les transitions sont contrôlées via un système interne :

```ts
_runtimeTransitions
```

Toute transition invalide déclenche une erreur :

```ts
INVALID_RUNTIME_TRANSITION
```

---

## Gestion des états

Le service maintient un état courant :

```ts
_runtimeState
```

Et expose :

* `getState()` → état courant
* `isState()` → vérification d’état

Cela permet :

* de tracer l’avancement du runtime
* de sécuriser les transitions
* de faciliter le debug

---

## Construction du runtime

Le runtime est construit progressivement dans un objet `_draft` :

```ts
this._draft.bootstrap = ...
this._draft.stage = ...
this._draft.globals = ...
this._draft.module = ...
```

Puis figé à la fin :

```ts
this.setResolved(this._draft);
```

---

## Mutation contrôlée

Un point fondamental :

> les hooks ne modifient jamais les managers.

Les mutations passent par :

* le runtime global (via `_draft`)
* des tools contrôlés

Cela garantit :

* l’intégrité des données des managers
* une séparation claire entre déclaration et exécution
* une traçabilité des modifications

---

## Relation avec les hooks

Le `RuntimeService` fournit des contextes adaptés à chaque phase.

---

### Stage

```ts
stageContext()
```

Contient :

* `bootstrap`
* `stage` (draft)

---

### Globals

```ts
globalsContext()
```

Contient :

* `bootstrap`
* `stage`
* `globals` (draft)

---

### Module

```ts
moduleContext()
```

Contient :

* `bootstrap`
* `stage`
* `globals`
* `module` (draft)

---

### Action

```ts
actionContext()
```

Contient :

* runtime complet et figé

---

## Rôle dans l’i18n et le parser

Le `RuntimeService` déclenche implicitement :

* la résolution de `I18nManager` après les stages
* l’initialisation du parser

Les engines n’ont pas connaissance directe de ces étapes.

Cela permet :

> de centraliser toute la logique d’orchestration au même endroit.

---

## Relation avec les engines

Les engines doivent :

* appeler les méthodes `set*()` dans l’ordre
* ne jamais reconstruire le runtime eux-mêmes

Le `RuntimeService` impose donc un contrat strict :

> l’engine orchestre, mais ne décide pas du runtime.

---

## Événements

Chaque étape émet des événements :

* `runtimeInit`
* `bootstrapInit` / `bootstrapReady`
* `stageInit` / `stageReady`
* `globalsInit` / `globalsReady`
* `actionInit` / `actionReady`
* `runtimeReady`

Cela permet :

* un suivi complet du lifecycle
* un pilotage event-driven (FedEngine)
* une observabilité totale

---

## Séparation avec les managers

Les managers :

* produisent des données
* sont responsables de leur résolution

Le `RuntimeService` :

* orchestre leur exécution
* agrège leurs résultats
* expose une vue unifiée

Cette séparation est essentielle.

---

## Rationalité

Le design repose sur une idée forte :

> un runtime doit être construit, pas improvisé.

Cela implique :

* une séquence stricte
* un état contrôlé
* une mutation limitée
* une séparation claire des responsabilités

Le `RuntimeService` est le garant de ces règles.

---

## Relations

### Avec les managers

Il appelle :

* `bootstrap.resolve()`
* `stages.resolve()`
* `i18n.resolve()`
* `globals.resolve()`
* `modules.resolve()`

---

### Avec `EventsManager`

Il émet tous les événements du lifecycle.

---

### Avec `ToolsService`

Les tools modifient indirectement le runtime via ce service.

---

### Avec les hooks

Il fournit les contextes runtime à chaque phase.

---

### Avec les engines

Il impose le flow d’exécution.

---

## Limitations actuelles

En v0.1 :

* orchestration encore simple
* pas de contrôle avancé des erreurs
* transitions fixes
* pas de rollback possible

Ces choix sont volontaires pour garder un core simple et déterministe.

---

## Évolutions futures

Les évolutions possibles incluent :

* instrumentation du runtime
* debug runtime avancé
* hooks internes supplémentaires

---

## Conclusion

`RuntimeService` est la colonne vertébrale du core.

Il ne contient pas de logique métier, mais il garantit que tout le reste fonctionne correctement.

> il ne fait pas le travail… mais il s’assure que le travail est fait dans le bon ordre, au bon moment, et de la bonne manière.

C’est cette rigueur qui permet au core d’être :

* prévisible
* extensible
* robuste

---
