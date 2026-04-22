# 🧱 ModulesManager

## Description

`ModulesManager` est la brique du runtime chargée de résoudre la structure fonctionnelle du CLI.

Il détermine :

* le module actif
* l’action à exécuter
* les options associées au module et à l’action
* les arguments restants

Il constitue la frontière entre :

* la configuration du runtime (bootstrap, stages, globals)
* et l’exécution métier (action)

C’est également le dernier manager exécuté avant le gel complet du runtime.

---

## But

Le `ModulesManager` sert à transformer la ligne de commande en une **intention d’exécution claire**.

Il permet de répondre à des questions fondamentales :

* quel module est ciblé ?
* quelle action doit être exécutée ?
* quelles options sont associées à cette action ?
* quels arguments doivent être transmis au métier ?

Son objectif est de produire un `RuntimeModuleFacts` complet, qui sera ensuite utilisé pour exécuter l’action correspondante.

---

## Pourquoi ce manager existe

Après les phases bootstrap, stage et globals, le runtime dispose :

* d’un environnement stabilisé
* d’options globales résolues
* d’un parser prêt

Mais il ne sait toujours pas **quoi exécuter concrètement**.

`ModulesManager` existe pour résoudre cette dernière étape logique :

> transformer l’entrée CLI en une cible d’exécution précise.

Il centralise :

* la sélection du module
* la sélection de l’action
* la gestion des modes d’exécution
* la gestion des fallback
* la liaison avec les hooks d’exécution

---

## Modes de fonctionnement

Le manager supporte plusieurs modes de fonctionnement.

### Mode modules + actions

Cas standard :

* un module est sélectionné
* une action est choisie dans ce module

### Mode defaultAction

Un module peut définir une action par défaut.

Dans ce cas :

* le module peut être appelé sans préciser explicitement l’action
* l’action par défaut est automatiquement sélectionnée

### Mode singleAction

Un runtime peut être défini avec un seul point d’entrée.

Dans ce cas :

* aucun module ni action n’est explicitement fourni dans le CLI
* une action unique est exécutée automatiquement

Ce mode est utilisé notamment pour les CLI simples ou encapsulées.

---

## Gestion des overrides globaux

Certaines options globales builtin permettent de court-circuiter la résolution classique.

En v0.1, deux cas existent :

* `--help` / `-h`
* `--version` / `-v`

Ces flags globaux permettent de projeter directement des modules builtin (`help`, `version`) sans passer par la résolution normale des modules/actions.

Cela garantit un comportement cohérent même en mode `singleAction`.

---

## Ordre de résolution

La résolution suit une logique déterministe :

1. vérifier les overrides globaux (`help`, `version`)
2. vérifier le mode `singleAction`
3. sinon, demander au parser de résoudre :

   * module
   * action
   * flags associés
4. récupérer le contexte parser final
5. construire le `RuntimeModuleFacts`

Le parser est responsable de la lecture syntaxique.

Le manager est responsable de la vérité runtime finale.

---

## Ce que produit ce manager

Le manager produit un `RuntimeModuleFacts` contenant :

* `moduleName`
* `moduleOptions`
* `actionName`
* `actionOptions`
* `args`

Ces données représentent l’intention d’exécution finale du CLI.

---

## Comportement interne

La résolution suit une séquence structurée :

1. construire les index internes (modules, actions, flags)
2. valider la cohérence des déclarations
3. déterminer le mode runtime
4. demander au parser de résoudre la phase module/action
5. construire le runtime final
6. exécuter le hook de module éventuel
7. figer le dictionnaire
8. marquer le manager comme résolu

---

## Index internes

Le manager construit plusieurs index pour garantir une résolution rapide et déterministe :

### Index des modules

* accès par nom
* accès par alias

### Index des actions

* par module
* accès par nom
* accès par alias

### Index des flags

* flags de module
* flags d’action

Ces index permettent au parser de fonctionner correctement sans avoir à parcourir toute la structure déclarative.

---

## Validation interne

Le manager valide plusieurs invariants :

* un module ne peut définir qu’un seul type d’action :

  * `actions`
  * `defaultAction`
  * `singleAction`
* un runtime ne peut pas mélanger `__defaultModule__` avec d’autres modules
* les collisions de structure sont interdites

Ces validations garantissent un modèle d’exécution clair et sans ambiguïté.

---

## Hooks et personnalisation

`ModulesManager` introduit deux types de hooks distincts.

---

### Hook de module (`ModuleHook`)

Le hook de module est exécuté après la résolution du runtime module.

Il permet d’agir sur :

* les options du module
* le runtime encore partiellement mutable

À ce stade :

* le runtime n’est pas encore totalement figé
* mais les possibilités de mutation sont déjà fortement limitées

Ce hook sert principalement à :

* ajuster des comportements liés au module
* préparer l’environnement juste avant l’exécution métier

---

### Hook d’action (`ActionHook`)

Le hook d’action correspond à **l’exécution réelle de l’action**.

À ce stade :

* le runtime est complètement résolu et figé
* le core n’a plus de responsabilité métier

Le hook reçoit :

* les options de l’action
* le runtime final
* les outils exposés par le core
* le snapshot

C’est ici que le développeur implémente la logique métier.

---

## Contexte des hooks

### ModuleHook

* runtime : partiel (non figé)
* options : options du module
* tools : accès limité
* snapshot : complet

### ActionHook

* runtime : complet et figé
* options : options de l’action
* tools : accès limité
* snapshot : complet

---

## Tools disponibles

À ce stade du runtime, les tools sont volontairement limités.

En v0.1 :

* `signal()`
* `message()`

Cela permet :

* d’émettre des événements
* d’utiliser l’i18n

Aucune mutation structurelle du runtime n’est autorisée à ce niveau.

---

## Runner

`ModulesManager` expose une méthode clé : `runner()`.

Cette méthode est utilisée par l’engine pour exécuter l’action finale.

Son rôle est de :

1. vérifier les éventuelles erreurs du parser
2. appliquer un fallback vers `help.show` si nécessaire
3. récupérer le hook d’action correspondant
4. exécuter ce hook avec le contexte approprié

Le runner constitue donc le lien direct entre :

* la résolution du runtime
* et l’exécution effective du CLI

---

## Gestion des fallback

Le manager gère plusieurs cas de fallback :

* erreurs du parser → redirection vers `help`
* absence de hook → erreur runtime
* overrides globaux → redirection vers modules builtin

Ces fallback garantissent un comportement robuste et prévisible du CLI.

---

## Rationalité

`ModulesManager` est la brique qui transforme une configuration en exécution.

Il marque une transition importante :

* avant lui → le core construit un runtime
* après lui → le core délègue au métier

Son design repose sur plusieurs principes :

* séparation stricte parsing / résolution / exécution
* déterminisme complet
* typage fort
* extensibilité via hooks
* limitation volontaire des capacités de mutation en fin de runtime

---

## Relations

### Avec `GlobalsManager`

Les globals peuvent influencer directement la résolution (ex: help/version).

### Avec `ParserManager`

Le parser est utilisé pour résoudre :

* module
* action
* flags
* arguments

### Avec `RuntimeService`

Le runtime est finalisé à ce niveau.

### Avec l’engine

Le runner est appelé par l’engine pour exécuter l’action finale.

### Avec `EventsManager`

Les hooks peuvent émettre des signaux et des messages.

---

## Limitations actuelles

En v0.1 :

* le système de fallback est encore en cours d’amélioration
* la gestion des erreurs parser est partiellement simplifiée
* le module help est encore basique
* certains comportements du runner restent à finaliser

---

## Évolutions futures

Les évolutions prévues incluent :

* amélioration du runner
* enrichissement du module help
* meilleure gestion des erreurs parser
* raffinement des hooks
* amélioration de la séparation runtime / métier

---

## Conclusion

`ModulesManager` est la brique la plus structurante du runtime.

Il transforme une entrée CLI en une exécution concrète, en gérant :

* les modes d’utilisation
* la résolution des modules et actions
* les fallback
* les hooks d’exécution

Il marque la fin du rôle du core dans la construction du runtime, et le début de l’exécution métier.

---
