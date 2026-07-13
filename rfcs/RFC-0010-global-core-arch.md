# Objectif

Le Core Vanilla ne fournit qu'un runtime procédural déterministe.

Il ne connaît que :

* le bootstrap ;
* le runtime ;
* les hooks ;
* les tools ;
* les events ;
* l'i18n ;
* le cycle d'exécution.

Tout le reste est extensible.

---

# Hiérarchie

```txt
Core Vanilla
      │
      ▼
Feature Plugins
      │
      ▼
AddOns
      │
      ▼
Application (WSC, Bot, ...)
```

---

# Core Vanilla

Responsabilité unique :

> Garantir une exécution CLI uniforme et déterministe.

Le Core ne gère jamais :

* une configuration métier ;
* un logger ;
* une console avancée ;
* des watchers ;
* git ;
* une BDD ;
* du réseau.

Il fournit uniquement les mécanismes nécessaires à leur implémentation.

---

# Feature Plugin

Définition :

> Ajoute une capability au runtime.

Exemples :

```
ConsolePlugin
LoggerPlugin
StatsPlugin
DaemonPlugin
FSNamespacePlugin
...
```

Invariants :

* dépend uniquement du Core Vanilla ;
* n'a jamais le droit de dépendre d'un autre Feature Plugin ;
* peut enrichir :

  * runtime ;
  * tools ;
  * hooks ;
  * snapshots ;
  * managers internes ;
  * providers ;
* ne fournit jamais de métier.

Autrement dit :

> Il enrichit le runtime.

---

# AddOn

Définition :

> Fournit une implémentation prête à l'emploi construite avec les capacités déjà disponibles.

Exemples :

```
ConfigModule
DoctorModule
InitModule
VersionModule
HelpModule (un jour peut-être)
```

Invariants :

* dépend du Core Vanilla ;
* peut dépendre d'un ou plusieurs Feature Plugins ;
* ajoute principalement :

  * modules ;
  * actions ;
  * configuration ;
  * commandes CLI prêtes à l'emploi.

Il n'ajoute aucune capability fondamentale.

Il utilise celles déjà présentes.

---

# PluginManager

Le PluginManager devient une brique du Core.

Chaque plugin possède au minimum :

```ts
type: "feature" | "addon";

name: string;

version: string;

dependencies: string[];

setup(...);

validate(...);
```

---

## Chargement

Ordonnancement obligatoire :

```txt
Bootstrap
        │
        ▼
Chargement Core
        │
        ▼
Chargement Feature Plugins
        │
        ▼
Validation Feature Plugins
        │
        ▼
Chargement AddOns
        │
        ▼
Validation AddOns
        │
        ▼
Déclarations utilisateur
        │
        ▼
CLI.run()
```

Ce point est extrêmement important.

Le développeur n'intervient qu'après le chargement complet des plugins.

Ainsi :

* les nouveaux hooks existent déjà ;
* les nouveaux tools existent déjà ;
* les nouveaux managers existent déjà ;
* les nouveaux providers existent déjà.

Le code du développeur voit donc un Core déjà "augmenté".

---

# Dépendances

Autorisées :

```
Feature → Core

AddOn → Core

AddOn → Feature(s)
```

Interdites :

```
Feature → Feature

AddOn → AddOn

Core → Plugin
```

On obtient naturellement un graphe acyclique.

---

# Philosophie

Le PluginManager ne repose sur aucune magie.

Un AddOn ne suppose jamais qu'une capability existe.

Il la déclare.

Exemple :

```ts
dependencies: [
    "ConsolePlugin",
    "LoggerPlugin"
]
```

Au chargement :

```
PluginManager

↓

validate()

↓

Missing required Feature:
ConsolePlugin
```

Erreur explicite.

---

# Cycle d'évolution du Core

Je pense qu'on a aussi trouvé la méthode officielle d'évolution.

1. Le besoin apparaît dans une application.

Exemple :

```
WSC
```

↓

2. L'implémentation est éprouvée.

↓

3. Les invariants apparaissent.

↓

4. On extrait.

↓

5. Cela devient :

* un Feature Plugin ;
* ou un AddOn.

Ainsi, le Core ne grossit jamais par anticipation.

Il évolue uniquement à partir de besoins validés.

---

# Ce que ça implique pour la roadmap

Je pense que tu as raison : on vient d'identifier le dernier gros chantier architectural du Core.

Les étapes deviennent assez claires :

```
✔ Runtime
✔ Hooks
✔ Tools
✔ Events
✔ Snapshot
✔ Contexts
✔ Runtime.app
✔ ResolvePath

⬜ Config globale (WSC)

⬜ RFC officielles

⬜ PluginManager

⬜ Feature Plugin API

⬜ AddOn API

⬜ i18n statique

⬜ v0.2.0
```

Et il y a un point que je trouve particulièrement satisfaisant : ce système est **auto-extensible**.

Une fois qu'il sera en place, tu n'auras plus besoin de te demander *"est-ce que cette fonctionnalité appartient au Core ?"* La réponse découlera presque automatiquement des invariants :

* si elle est nécessaire au fonctionnement du runtime procédural → Core ;
* si elle ajoute une nouvelle capacité réutilisable → Feature Plugin ;
* si elle assemble des capacités existantes pour fournir une fonctionnalité prête à l'emploi → AddOn ;
* si elle répond à un besoin spécifique d'une application → métier.


