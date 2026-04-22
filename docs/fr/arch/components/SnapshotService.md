# 🧱 SnapshotService

## Description

`SnapshotService` est le service chargé d’exposer un snapshot complet des dictionnaires de déclaration du core.

Il fournit un accès en lecture seule à l’ensemble des données déclaratives :

* événements
* stages
* traductions
* globals
* modules

Ce snapshot est accessible dans tous les hooks via le contexte.

---

## But

Le `SnapshotService` sert à donner une vue globale et cohérente de la configuration du CLI, telle qu’elle a été déclarée à l’initialisation.

Il permet notamment :

* d’inspecter la structure complète du CLI
* d’accéder aux définitions des modules et actions
* de lire les configurations déclaratives
* de construire des comportements dynamiques basés sur la déclaration

Son objectif est simple :

> fournir une vision complète du système sans permettre de le modifier.

---

## Pourquoi ce service existe

Le core repose sur une séparation stricte entre :

* déclaration (init)
* résolution (runtime)
* exécution (hooks)

Mais dans certains cas, le développeur a besoin de :

* comprendre la structure complète du CLI
* accéder à des informations non présentes dans le runtime
* introspecter les déclarations

Sans `SnapshotService`, cela impliquerait :

* exposer directement les managers
* casser l’encapsulation
* introduire des risques de mutation

Ce service existe donc pour fournir :

* une vue globale
* sans casser les invariants du core

---

## Portée

En v0.1, `SnapshotService` est responsable de :

* exposer les dictionnaires déclaratifs complets
* fournir un accès simple et uniforme dans les hooks
* garantir une lecture sans mutation

Il ne fait pas :

* de transformation de données
* de logique métier
* de résolution runtime
* de validation
* de mutation

Il agit uniquement comme un exposeur.

---

## Principe de fonctionnement

Le service construit un objet snapshot à la demande :

```ts
snapshotContext()
```

Ce snapshot contient :

* `settings`
* `events`
* `stages`
* `i18n`
* `globals`
* `modules`

Ces données proviennent directement des dictionnaires internes des managers.

---

## Nature du snapshot

Le snapshot est :

* complet
* cohérent
* immuable

Pourquoi ?

Parce que tous les dictionnaires :

* sont construits à l’initialisation
* sont validés dès leur création
* sont ensuite figés (`freeze`)

Cela garantit :

> une seule source de vérité, identique partout dans le runtime.

---

## Disponibilité dans les hooks

Le snapshot est accessible dans tous les hooks via :

```ts
snapshot: this.ctx.snapshot.snapshotContext()
```

Cela permet au développeur de :

* lire la configuration complète
* adapter son comportement dynamiquement
* introspecter le CLI sans dépendre du runtime courant

---

## Différence avec le runtime

C’est un point clé.

Le snapshot représente :

👉 la **déclaration initiale**

Le runtime représente :

👉 l’**état résolu en cours d’exécution**

Exemple :

* snapshot → tous les modules déclarés
* runtime → le module actuellement exécuté

Cette distinction est fondamentale dans le design du core.

---

## Cas d’usage

Le snapshot est particulièrement utile pour :

* générer dynamiquement de l’aide (`help`)
* introspecter les modules disponibles
* construire des comportements génériques
* créer des outils de debug
* analyser la configuration du CLI

---

## Sécurité et invariants

Le snapshot est volontairement en lecture seule.

Il est impossible de :

* modifier les dictionnaires
* injecter des valeurs
* altérer la configuration

Cela garantit :

* la stabilité du runtime
* l’intégrité des déclarations
* l’absence d’effets de bord

---

## Rationalité

Le design repose sur une idée simple :

> donner de la visibilité sans donner du pouvoir de mutation.

Cela permet :

* d’offrir une introspection complète
* sans compromettre la stabilité du core
* sans exposer les managers internes

C’est une brique de transparence, pas de contrôle.

---

## Relations

### Avec les managers

Le service lit directement les settings globales et les dictionnaires des managers :

* `CLISettings`
* `EventsManager`
* `StagesManager`
* `I18nManager`
* `GlobalsManager`
* `ModulesManager`

Il ne modifie jamais ces données.

*N.B. : Les settings représentent la configuration globale du CLI au moment de l’initialisation, et permettent aux hooks d’adapter leur comportement en fonction du mode d’exécution.*

---

### Avec les hooks

Le snapshot est principalement utilisé dans les hooks pour :

* introspection
* logique dynamique
* debug

---

### Avec `ApiService` et `ToolsService`

Le snapshot est exposé via les contextes fournis aux hooks.

---

## Limitations actuelles

En v0.1 :

* le snapshot est reconstruit à chaque appel
* aucune vue partielle n’est proposée
* aucune transformation ou filtrage n’est appliqué

Ces limitations sont acceptables étant donné la simplicité et le coût faible de l’opération.

---

## Évolutions futures

Les évolutions possibles incluent :

* optimisation de la construction du snapshot
* vues partielles ou filtrées
* outils d’introspection avancés
* intégration avec des outils de debug ou de documentation

---

## Conclusion

`SnapshotService` est une brique simple mais essentielle.

Il fournit une vue complète et immuable de la configuration du CLI.

> il permet de voir tout le système… sans jamais pouvoir le casser.

C’est cette combinaison entre transparence et sécurité qui en fait un outil clé pour les hooks et l’introspection du core.

---
