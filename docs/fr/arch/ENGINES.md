# ⚙️ Engines

## Description

Les engines sont responsables de l’exécution du runtime.

Ils orchestrent les différentes étapes du lifecycle en utilisant le `RuntimeService`, sans jamais reconstruire eux-mêmes le runtime.

Leur rôle est simple :

* appeler les phases dans le bon ordre
* déclencher la construction du runtime
* exécuter le `runner` final

---

## But

Les engines permettent de définir **différentes stratégies d’exécution** du runtime.

Ils offrent la possibilité de :

* exécuter le core de manière procédurale
* ou piloter l’exécution via un système d’événements

Leur objectif est clair :

> séparer la logique d’exécution du runtime de sa construction.

---

## CoreEngine (sélecteur)

`CoreEngine` est le point d’entrée des engines.

Il ne fait qu’une chose :

* sélectionner l’engine à utiliser en fonction des settings

```ts id="u9x2lp"
const engineName = this.ctx.settings.engine ?? 'std';
```

Puis :

* instancier l’engine correspondant
* lui fournir le `runner`
* déléguer l’exécution

---

### Rôle

* sélectionner l’engine
* injecter le contexte
* transmettre le runner

👉 Il ne contient aucune logique d’exécution.

---

## Engines disponibles

En v0.1, deux engines sont disponibles :

* `StandardEngine`
* `FedEngine`

---

## StandardEngine

### Description

`StandardEngine` exécute le runtime de manière procédurale.

Il appelle les différentes phases dans l’ordre :

```text id="a8c4kd"
init → bootstrap → stage → globals → action → ready → runner
```

---

### Fonctionnement

```ts id="m3p7qz"
await this.ctx.runtime.setInit();
await this.ctx.runtime.setBootstrap();
await this.ctx.runtime.setStage();
await this.ctx.runtime.setGlobals();
await this.ctx.runtime.setAction();
await this.ctx.runtime.setReady();
await this.runner();
```

---

### Caractéristiques

* simple
* lisible
* prévisible
* sans abstraction supplémentaire

C’est le mode recommandé par défaut.

---

### Usage

Adapté pour :

* la majorité des CLI
* un comportement standard
* un runtime clair et direct

---

## FedEngine (Event-Driven)

### Description

`FedEngine` (Full Event-Driven) pilote le runtime entièrement via les événements.

Au lieu d’enchaîner les appels, il :

* s’enregistre comme listener sur les événements du lifecycle
* déclenche les étapes en réaction à ces événements

---

### Fonctionnement

Chaque phase est déclenchée par un événement :

```text id="r5n2vk"
runtimeInit → bootstrapReady → stageReady → globalsReady → actionReady → runtimeReady
```

Exemple :

```ts id="z8f1tx"
events.registerFlowListener("bootstrapReady", {
  handler: async () => {
    await this.ctx.runtime.setStage();
  }
});
```

---

### Exécution finale

Lorsque `runtimeReady` est émis :

```ts id="y3k8pw"
await this.runner();
```

---

### Caractéristiques

* entièrement basé sur les événements
* découplé du flow procédural
* extensible
* observable

---

### Rôle du flag `trigger`

Le `FedEngine` repose sur les événements ayant :

```ts id="c6m2qs"
trigger: true
```

Cela permet de définir quels événements pilotent réellement le flow.

---

### Usage

Adapté pour :

* des architectures event-driven
* des systèmes extensibles
* des cas avancés (plugins, orchestration complexe)

---

## Runner

Le `runner` est fourni par le `ModulesManager`.

Il est responsable de :

* sélectionner l’action à exécuter
* gérer les fallbacks (ex: help)
* exécuter le hook d’action

Les engines ne connaissent pas la logique métier :

> ils se contentent d’exécuter le runner.

---

## Contrat des engines

Un engine doit impérativement :

* respecter l’ordre du runtime
* appeler les méthodes du `RuntimeService`
* ne jamais reconstruire le runtime lui-même
* exécuter le runner uniquement après `setReady()`

---

## Relation avec le RuntimeService

Les engines dépendent entièrement du `RuntimeService`.

Ils doivent :

* appeler ses méthodes (`setInit`, `setBootstrap`, etc.)
* respecter les transitions
* ne jamais bypasser son fonctionnement

👉 Le `RuntimeService` reste le seul garant du runtime.

---

## Rationalité

Le design repose sur une séparation claire :

* `RuntimeService` → construit le runtime
* `Engine` → orchestre l’exécution

Cela permet :

* plusieurs stratégies d’exécution
* une meilleure extensibilité
* un runtime toujours cohérent

---

## Limitations actuelles

En v0.1 :

* seulement deux engines disponibles
* pas de système d’engine custom public
* `FedEngine` dépend du système d’événements existant

Ces limitations sont volontaires pour garder un core simple.

---

## Évolutions futures

Les évolutions possibles incluent :

* support d’engines custom
* enrichissement du mode event-driven
* outils de debug pour le flow event-driven
* intégration avec le futur système de plugins

---

## Conclusion

Les engines définissent comment le runtime est exécuté, sans jamais en modifier la construction.

Deux approches sont proposées :

* procédurale (`StandardEngine`)
* event-driven (`FedEngine`)

> le runtime reste identique, seule la manière de l’exécuter change.
