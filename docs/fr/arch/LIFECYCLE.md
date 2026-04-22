# Cycle de vie du Core

## Cycle de base

```mermaid
flowchart LR

%% UX/DX
A["cliCreator()"]

%% Config Building & init
B["CLI.init()"]

%% Hooking part
C["CLI.hooks()"]

%% Runtime Part
D["CLI.run()"]

A --> B
B --> C
C --> D

```

Le cycle de vie du core suit toujours la même séquence :

* cliCreator() : construction de la configuration côté développeur (UX/DX)
* CLI.init() : initialisation complète du core et de ses briques internes
* CLI.hooks() : enregistrement des hooks runtime
* CLI.run() : exécution du runtime et de l’action sélectionnée

Ce découpage permet de séparer clairement :

* la définition (UX/DX)
* la construction (init)
* le branchement (hooks)
* l’exécution (runtime)

---

## Disponibilité des types d'events

Les différents types d'events ne sont pas disponibles à tous les moments du cycle de vie du core.

* `CoreError` :
  * disponible avant et pendant toute la phase d'initialisation (`cliCreator` & `CLI.init`)

* `Signal` :
  * disponible dès que `EventsManager` est initialisé

* `Message` :
  * disponible uniquement pendant le `runtime`,
  * après la résolution du `stage` et l'initialisation de `i18n`

*Ces règles sont fondamentales pour comprendre le comportement du core, notamment dans l'écriture des hooks et la gestion des erreurs.*

---

## Cycle de création CLI (UX/DX) - cliCreator

```mermaid
flowchart LR

A[cliCreator]
B[dev settings]
C[build init dict]
D["CLI.init()"]

A --> B
B --> C
C --> D
```

Le `cliCreator` correspond à la phase de définition côté développeur.

Il permet de :

* définir les paramètres UX/DX (modules, actions, flags, stages, etc.)
* construire un dictionnaire d'initialisation (init dict)
* préparer les données qui seront consommées par CLI.init()

Cette phase ne contient aucune logique runtime : elle sert uniquement à produire une configuration structurée et typée.

---

## Cycle d'initialisation

```mermaid
flowchart TD

A["CLI.init()"]

subgraph Builders
B1[EventsBuilder]
B2[StagesBuilder]
B3[GlobalsBuilder]
B4[ModulesBuilder]
B5[I18nBuilder]
end

C[Config normalization & merge]

subgraph Core Initialization
D[Instantiate shared context]

E1[EventsManager.init]
E2[Other Managers.init]
E3[Services.init]
E4[Engine.init]
end

F[CLI Instance Ready]

A --> B1
A --> B2
A --> B3
A --> B4
A --> B5

B1 --> C
B2 --> C
B3 --> C
B4 --> C
B5 --> C

C --> D

D --> E1
D --> E2
D --> E3
D --> E4

E1 --> F
E2 --> F
E3 --> F
E4 --> F
```

Le cycle d'initialisation du core se décompose en deux étapes :

### 1. Construction de la configuration

Les builders permettent de :

* générer les structures internes nécessaires (events, stages, globals, modules, i18n)
* fusionner les builtins et les déclarations custom
* normaliser et valider la configuration finale

### 2. Initialisation du core

Une fois la configuration prête :

* un contexte partagé est instancié
* toutes les briques internes sont initialisées :
  * managers
  * services
  * engine

À la fin de cette phase, l’instance CLI est prête à être utilisée.

---

## Cycle des hooks

```mermaid
flowchart TD

A[CLI.hooks]
B1[Register stage hooks]
B2[Register globals hooks]
B3[Register module hooks]
B4[Register action hooks]
C[Bind typed runtime contexts]
D[Hooks ready]

A --> B1
A --> B2
A --> B3
A --> B4
B1 --> C
B2 --> C
B3 --> C
B4 --> C
C --> D
```

### Types de hook

| Hook         | Phase runtime | Rôle principal                    |
|--------------|--------------|----------------------------------|
| StageHook    | stage        | Initialisation environnement      |
| GlobalsHook  | globals      | Résolution options globales       |
| ModuleHook   | module       | Gestion flags module              |
| ActionHook   | runtime      | Exécution de l’action             |

### Description

Il existe 4 types de hooks, chacun agissant sur une phase spécifique du runtime :

* StageHook : Premier hook exécuté. Il permet de définir des éléments fondamentaux du runtime avant sa validation complète:
  * langue
  * variables d’environnement (ENV)
  * contexte d’exécution (ex : sandbox)

* GlobalsHook :
  Exécuté lors de la résolution des globals
  Permet d’agir sur les options globales et leurs flags associés.

* ModuleHook :
  Exécuté avant l'action.
  Permet de gérer les flags spécifiques au module sélectionné.

* ActionHook :
  Hook final d’exécution.
  Une fois le runtime figé, il contient la logique et le code de l'action.

---

## Cycle du runtime

```mermaid
flowchart TB
  subgraph TOP [ ]
    direction LR
    subgraph CLI
        direction TB
        A[CLI.run] --> B[CoreEngine.run]
    end
    subgraph ENGINE ['Engine Flow']
        direction TB
        C[Selected Engine.run]
        D[RuntimeService orchestration]
        E[ModulesManager.runner]
        F[Selected action hook execution]
        C --> D --> E --> F
    end
    CLI --> ENGINE

  end
```

Le runtime correspond à la phase d’exécution réelle du core.

Il est responsable de :

* orchestrer les différentes phases de construction du runtime
* sélectionner et exécuter le moteur approprié
* déclencher le runner associé à l’action sélectionnée

Le flux est le suivant :

1. `CLI.run` démarre l’exécution
2. `CoreEngine` sélectionne le moteur
3. le moteur orchestre le runtime via le `RuntimeService`
4. le `ModulesManager` fournit le `runner`
5. le hook d’action est exécuté

Pendant cette phase :

* le core passe progressivement de CoreError à un système event-driven (signal uniquement)
* les messages ne sont pas encore disponibles (pas de runtime, pas de i18n)

### Events system base

```mermaid
flowchart TD

A[Emit Event]
B[Flow listeners]
C[Output listeners]
D[Terminate flow listeners]
E[Output channels]
F[Runtime stop]

A --> B
A --> C
A --> D
C --> E
D --> F
```

Le système d’events est transversal à tout le core.

Il permet de :

* émettre des événements (signal ou message)
* écouter les événements via différents types de listeners
* produire des sorties (logs, console, etc.)
* contrôler le flux d’exécution

Certains events (error, fatal) peuvent déclencher l’arrêt du runtime via les terminate flow listeners.

### Engines vs RuntimeService

```mermaid
flowchart LR

A[CoreEngine]
B[Selected Engine]
C[RuntimeService]
D[Runner]

A --> B
B --> C
C --> D
```

Le rôle des différentes briques est clairement séparé :

* `CoreEngine` : sélectionne le moteur à utiliser
* `Engine` : orchestre le flux d’exécution
* `RuntimeService` : garantit les phases et l’intégrité du runtime
* `Runner` : exécute l’action finale

### RuntimeService Phases

```mermaid
flowchart LR

A[setInit]
B[setBootstrap]
C[setStage]
D[setGlobals]
E[setAction]
F[setReady]

A --> B
B --> C
C --> D
D --> E
E --> F
```

Le RuntimeService est responsable de la progression du runtime.

Chaque phase correspond à un état validé du système :

* `setInit` : initialisation du runtime
* `setBootstrap` : préparation initiale
* `setStage` : résolution du stage et de l’environnement
* `setGlobals` : résolution des options globales
* `setAction` : sélection du module et de l’action
* `setReady` : runtime figé, prêt à exécuter

Ces phases garantissent :

* un ordre strict d’exécution
* une cohérence du runtime
* une base fiable pour les hooks et les events
