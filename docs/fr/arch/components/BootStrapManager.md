# 🧱 BootstrapManager

## Description

`BootstrapManager` est le tout premier manager du runtime exécuté par le core.

Son rôle est de récupérer l’environnement d’exécution brut au moment où le CLI démarre, puis de le normaliser en un premier bloc de `RuntimeCoreFacts`.

Il ne contient aucune logique métier, aucun hook utilisateur, et aucune customisation déclarative en v0.1.

Son but est uniquement de construire une base technique fiable à partir du shell courant et du processus Node.js.

---

## But

Le `BootstrapManager` sert à produire les **premiers facts du runtime** à partir de l’environnement réel d’exécution.

Il récupère principalement :

* la ligne de commande (`process.argv`)
* le chemin courant (`process.cwd()`)
* l’environnement système (`process.env`)
* les informations minimales sur le script exécuté

Cette étape est totalement automatique.

Le but est de garantir qu’à partir de ce point, le core dispose d’un socle homogène, indépendamment de la manière dont le script a été lancé.

---

## Pourquoi ce manager existe

Le core a besoin d’un point de départ déterministe avant toute autre résolution.

Avant de parler de :

* stages
* globals
* parser
* modules
* actions

il faut d’abord savoir **dans quel contexte réel le CLI s’exécute**.

`BootstrapManager` existe donc pour isoler cette responsabilité très tôt dans le lifecycle :

* lire l’environnement brut
* construire un objet runtime stable
* exposer une structure prévisible au reste du core

Cela évite de disperser l’accès direct à `process.argv`, `process.env` ou `process.cwd()` dans plusieurs parties du système.

---

## Portée

En v0.1, `BootstrapManager` est volontairement limité.

Il :

* lit les informations système minimales
* extrait les facts du script courant
* stocke les variables d’environnement brutes
* initialise les premiers `RuntimeCoreFacts`

Il ne fait pas :

* de détection avancée multi-plateforme
* de résolution shell spécifique
* de transformation complexe des variables d’environnement
* de logique dépendante du projet utilisateur
* de customisation via hooks

Son périmètre est strictement technique et fondamental.

---

## Ce que produit ce manager (Resolved Runtime Facts)

Le manager produit un premier bloc de runtime contenant notamment :

### Node executable

Le binaire Node utilisé pour lancer le script.

### Current working directory

Le dossier courant depuis lequel le CLI a été exécuté.

### Script facts

Informations sur le script courant :

* commande complète
* chemin brut du script
* nom du fichier
* extension
* dossier parent
* arguments restants

### Environment variables

Une copie brute de `process.env`, stockée dans `runtime.envs`.

---

## Comportement interne

La résolution suit une logique simple :

1. émettre un événement interne d’initialisation du bootstrap
2. lire l’environnement d’exécution courant
3. extraire les informations minimales du script et du shell
4. construire les `RuntimeCoreFacts`
5. marquer le manager comme résolu

Le manager ne dépend d’aucun autre état runtime préalable.

C’est pour cela qu’il constitue la toute première étape concrète de résolution.

---

## Rationalité

Le bootstrap est séparé du reste du runtime pour une raison simple :

> le core doit d’abord observer l’environnement tel qu’il est, avant de commencer à le structurer.

Cette séparation permet de garder un design propre :

* `BootstrapManager` observe
* les managers suivants interprètent, enrichissent ou projettent

Cela garantit aussi une meilleure portabilité future : la logique de récupération système pourra évoluer sans impacter les autres briques du core, tant que les facts produits gardent la même forme.

---

## Relations

### Avec `RuntimeService`

Les facts produits par `BootstrapManager` servent de base au runtime global.

Ils sont ensuite injectés dans le flux général du runtime via les services et managers suivants.

### Avec `StagesManager`

Les stages s’appuient sur le contexte de base fourni par le bootstrap, notamment :

* le chemin courant
* l’environnement système
* le contexte d’exécution global

### Avec le "parser" et les autres managers

Le parser et les autres managers ne lisent pas directement le shell ou `process.*`.

Ils doivent s’appuyer sur les facts déjà construits par le bootstrap.

Cela renforce la cohérence interne du core.

### Avec `EventsManager`

Le manager émet un événement interne au démarrage de sa résolution.

Cette émission permet de tracer l’entrée dans la phase bootstrap dès les premiers instants du runtime.

---

## Pas de méthode crochet (Hook) / Pas de personnalisation

En v0.1, `BootstrapManager` ne propose :

* aucun hook dédié
* aucune surcharge utilisateur
* aucune configuration déclarative spécifique

C’est un choix volontaire.

Le bootstrap doit rester une étape entièrement maîtrisée par le core, afin de garantir une base de runtime simple, fiable et déterministe.

---

## Limitations actuelles

En v0.1, l’implémentation est encore volontairement minimale.

Les limites connues sont :

* support réel limité à Linux
* comportement pensé autour d’un environnement Bash
* absence de sélection explicite de plateforme
* absence de gestion fine des spécificités shell
* extraction très simple des informations du script

Cette première version privilégie la clarté et la stabilité du contrat runtime.

---

## Evolutions futures

Les évolutions prévues pour les versions suivantes incluent :

* sélection automatique de la plateforme
* prise en charge de plusieurs environnements :

  * Linux
  * Windows
  * Darwin
* ajout d’un loader ou resolver dédié par plateforme
* ajout d’un niveau de résolution shell selon l’environnement détecté
* production de facts homogènes quelle que soit la plateforme d’origine

L’objectif long terme est clair :

> fournir exactement les mêmes `RuntimeCoreFacts`, quel que soit l’environnement de départ.

Autrement dit, le bootstrap devra absorber les différences système pour exposer une base commune au reste du core.

---

## Conclusion

`BootstrapManager` est la porte d’entrée technique du runtime.

Il ne décide rien, n’interprète rien de fonctionnel, et n’expose aucune customisation utilisateur.

Il se contente de faire une chose, mais il doit la faire parfaitement :

> capturer l’environnement réel d’exécution et le transformer en facts runtime de base, fiables et homogènes.

C’est cette neutralité qui en fait une brique essentielle du lifecycle.

---
