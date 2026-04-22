# 🧱 MetaManager

## Description

`MetaManager` est un composant du core chargé de centraliser les informations de métadonnées du framework et du CLI.

En v0.1, il propose une implémentation minimale basée sur des valeurs statiques définies à l’initialisation.

Il ne participe pas au runtime de résolution, et ne possède pas de logique dynamique.

---

## But

Le `MetaManager` sert à exposer un point d’accès unique pour les informations liées :

* au core lui-même
* au CLI construit avec le core

Ces informations peuvent être utilisées notamment pour :

* afficher une version (`--version`)
* exposer des informations système
* enrichir des logs ou messages
* préparer des intégrations futures avec des outils externes

---

## Pourquoi ce manager existe

Même si la logique est simple en v0.1, le besoin est réel :

> le core doit pouvoir exposer ses propres informations de manière centralisée et cohérente.

Sans cette brique, les métadonnées seraient :

* dispersées dans le code
* difficiles à maintenir
* difficiles à faire évoluer

`MetaManager` pose donc une base propre pour :

* centraliser ces informations
* préparer leur évolution vers un système dynamique

---

## Portée

En v0.1, `MetaManager` est volontairement limité.

Il :

* stocke des métadonnées statiques
* expose ces données via le contexte
* ne dépend d’aucune autre brique du runtime

Il ne fait pas :

* de récupération dynamique de version
* de lecture depuis Git
* de gestion automatique des builds
* de synchronisation avec des outils externes
* de customisation via hooks

Son rôle actuel est purement déclaratif.

---

## Structure des données

Le manager expose une structure simple :

### Core

Informations liées au framework :

* `version` : version du core
* `build` : identifiant de build (optionnel)
* `author` : auteur du core
* `git` : lien vers le repository (optionnel)

### CLI

Informations liées au CLI utilisateur :

* `name` : nom du CLI
* `version` : version du CLI
* `author` : auteur du CLI

Cette séparation permet de distinguer clairement :

* le moteur (core)
* l’application (CLI)

---

## Comportement

Le manager est initialisé avec un dictionnaire statique.

Contrairement aux autres managers :

* il ne possède pas de méthode `resolve()`
* il ne participe pas aux phases du runtime
* il n’émet pas d’événements
* il ne dépend d’aucune donnée runtime

Il agit simplement comme un composant de configuration accessible à tout moment.

---

## Utilisation typique

En v0.1, `MetaManager` est principalement utilisé pour :

* alimenter le module builtin `version`
* exposer des informations de base dans le CLI
* servir de point d’entrée pour les métadonnées

Il reste volontairement discret dans le fonctionnement global du core.

---

## Rationalité

Le design actuel est volontairement minimaliste.

L’objectif n’est pas de construire un système complet de versioning dès la v0.1, mais de :

* poser une structure claire
* éviter la dispersion des métadonnées
* préparer une évolution future sans casser l’existant

C’est une brique de fondation.

---

## Relations

### Avec `ModulesManager`

Le module builtin `version` peut s’appuyer sur les données fournies par `MetaManager`.

### Avec le CLI utilisateur

Le développeur peut injecter ou utiliser ces métadonnées pour enrichir son CLI.

### Avec les futures briques

`MetaManager` est destiné à devenir une source de données pour :

* les systèmes de build
* les pipelines CI/CD
* les outils de versioning

---

## Limitations actuelles

En v0.1 :

* les données sont entièrement statiques
* aucune intégration avec Git
* aucun système de version automatique
* aucune gestion des builds
* aucune validation avancée

Ces limites sont connues et assumées.

---

## Évolutions futures

Les évolutions prévues incluent :

* connexion avec le versioning Git
* génération automatique de version
* gestion des numéros de build
* intégration avec des outils de build (ex: tsup)
* enrichissement des métadonnées CLI
* exposition plus riche pour les plugins et outils

L’objectif est de transformer cette brique en un véritable point central de gestion des métadonnées du projet.

---

## Conclusion

`MetaManager` est une brique simple mais structurante.

En v0.1, il se contente de stocker des informations statiques, mais il pose les bases d’un système plus avancé.

> il ne fait presque rien aujourd’hui, mais il est là pour éviter de devoir tout refaire demain.

---
