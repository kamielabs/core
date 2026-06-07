# NON_GOALS

Ce document définit les contraintes architecturales volontairement exclues du périmètre du runtime.

Ces éléments ne sont pas considérés comme des fonctionnalités manquantes.

Ils sont le résultat de choix de conception délibérés.

Toute proposition entrant en conflit avec ces contraintes doit être considérée comme incompatible avec l'architecture actuelle du runtime.

---

## 1. Aucun Backtracking du Parser

Le parser doit rester entièrement déterministe.

Un token doit posséder une unique signification au moment où il est lu.

Interdit :

* Backtracking
* Réinterprétation de tokens
* Parsing multi-passes
* Réessais de routes
* Reconstruction de commande après analyse

Le parser doit résoudre une commande au travers d'une unique lecture de gauche à droite.

---

## 2. Aucune Grammaire Runtime Dynamique

La grammaire du runtime doit être entièrement connue avant l'exécution.

Interdit :

* Création de modules à l'exécution
* Création d'actions à l'exécution
* Modification dynamique du parser
* Injection dynamique de grammaire
* Enregistrement de routes après l'initialisation du runtime

Les modules, actions, globals et stages doivent être déclarés et validés avant le démarrage du runtime.

---

## 3. Aucun Flag à Valeur Multi-Tokens

Les flags possédant une valeur doivent rester autoportants.

Autorisé :

```txt
--lang=fr
--config=./config.json
```

Interdit :

```txt
--lang fr
--config ./config.json
```

Le parser ne doit jamais avoir besoin d'inspecter les tokens suivants afin de déterminer la signification du token courant.

---

## Pourquoi Ces Contraintes Existent

Ces contraintes garantissent :

* Un parsing déterministe
* Un routage prévisible
* Une introspection fiable
* Des snapshots stables
* Une validation simplifiée
* Une maintenance durable

L'objectif de ce runtime n'est pas de maximiser la flexibilité.

L'objectif est de fournir un contrat d'exécution déterministe, prévisible et maintenable sur le long terme.

---

## Évolutions Futures

Les futures versions pourront introduire de nouvelles capacités, APIs, plugins ou couches d'outillage.

Cependant, ces évolutions devront préserver les contraintes définies dans ce document.

Ces contraintes sont considérées comme des invariants architecturaux.
