# TEST_PLAN.md

## Objectif

Ce document définit la stratégie de tests du runtime Core.

L'objectif de la v0.1 n'est pas d'atteindre une couverture exhaustive mais de valider la stabilité du runtime, du parser, du système d'aide et des principaux flux d'exécution avant la première Release Candidate.

Les tests sont volontairement orientés comportement runtime et scénarios d'intégration.

Les tests unitaires seront introduits après les refontes prévues en post-v0.1 (partial contexts, createTest, isolation des services).

---

## État actuel

Version : v0.1-rc.1

Statut : Actif

Philosophie :

* Validation du runtime avant tout
* Validation des happy paths et error paths
* Validation des comportements publics avant les détails d'implémentation
* Exécution réelle de la CLI
* Validation des sorties utilisateur
* Détection des régressions lors des refactors

---

## Suites de tests implémentées

### 00000.sanity.test.ts

Objectif :

Valider l'infrastructure de test.

Couverture :

* Exécution de Vitest
* Validation de l'environnement de test

---

### 00001.integration-happy-1.test.ts

Objectif :

Valider une exécution nominale du runtime.

Couverture :

* Exécution d'un module
* Exécution d'une action
* Déclenchement des hooks runtime
* Démarrage complet de la CLI

---

### 00002.integration-errors-1.test.ts

Objectif :

Valider le comportement du runtime autour du chargement des environnements.

Couverture :

* Chargement d'un fichier .env
* Initialisation du runtime avec des valeurs de stage personnalisées
* Gestion des erreurs terminales
* Interception de process.exit()

---

### 00003.usage-errors-1.test.ts

Objectif :

Valider les erreurs du parser et leur routage.

Couverture :

* Flag global inconnu
* Module inconnu
* Flag de module inconnu
* Action inconnue
* Flag d'action inconnu

Validation :

* Messages d'erreur
* Routage des usages
* Codes de sortie

---

### 00004.help-module-routes-happy-1.test.ts

Objectif :

Valider l'ensemble des routes d'aide disponibles.

Couverture :

#### Aide globale

* Aide standard
* Aide complète

#### Stages

* Liste des options de stage
* Détail d'une option de stage

#### Options globales

* Liste des options globales
* Détail d'une option globale
* Recherche par flag
* Recherche par variable d'environnement

#### Modules

* Liste des modules
* Aide d'une action par défaut
* Aide d'un flag d'action par défaut
* Aide d'un module
* Aide d'une action

---

### 00005.help-module-routes-errors-1.test.ts

Objectif :

Valider les erreurs de routage du système d'aide.

Couverture :

* Variable d'environnement de stage inconnue
* Option globale inconnue
* Module inconnu
* Action nommée non supportée sur un module à action par défaut
* Action inconnue
* Flag de module inconnu
* Flag d'action inconnu

Validation :

* Messages d'erreur
* Messages d'usage
* Codes de sortie

---

## Résumé de la couverture actuelle

La RC couvre actuellement :

* Initialisation du runtime
* Arrêt du runtime
* Chargement des environnements
* Exécution des modules
* Exécution des actions
* Routage du parser
* Routage du système d'aide
* Routage des erreurs
* Routage des usages
* Événements terminaux
* Gestion des codes de sortie

L'accent est volontairement mis sur le comportement observable du runtime.

Les détails internes d'implémentation ne sont pas encore couverts.

---

## Tests runtime prévus

Les tests suivants sont identifiés mais volontairement reportés après la RC initiale.

### Validation fine du parser

Couverture :

* Groupement de flags courts
* Flags courts combinés
* Flags à valeur
* Résolution canonique
* Résolution des alias
* Cas limites du parser

Exemples :

* -abc
* -a=value
* --flag=value

---

### Validation des phases runtime

Couverture :

* beforeRuntime
* afterRuntime
* beforeParser
* afterParser
* beforeExecution
* afterExecution

Objectif :

Valider l'ordre exact du cycle de vie du runtime.

---

### Validation du système d'événements

Couverture :

* Événements de type signal
* Événements de type message
* Événements terminaux
* Warnings
* Propagation des événements

Objectif :

Valider toutes les catégories d'événements supportées par le runtime.

---

### Validation des snapshots

Couverture :

* Snapshots runtime
* Index
* Structures construites
* Dictionnaires de résolution

Objectif :

Garantir l'intégrité des snapshots lors des futures évolutions.

---

## Stratégie future des tests unitaires

Les tests unitaires sont volontairement reportés après la v0.1.

Raison :

Plusieurs services internes vont encore évoluer durant les prochaines versions.

Créer une importante base de tests unitaires maintenant générerait un coût de maintenance inutile.

---

### Prérequis identifiés

#### createTest()

Framework interne destiné à simplifier l'écriture des tests.

Objectifs :

* Réduction du boilerplate
* Écriture plus rapide des tests
* Assertions partagées
* Setup partagé

---

#### Partial Contexts

Les services devront recevoir uniquement les dépendances dont ils ont réellement besoin.

Bénéfices :

* Mocking simplifié
* Isolation améliorée
* Réduction du couplage
* Tests unitaires plus simples

---

### Services ciblés

#### ParserManager

Couverture :

* Résolution des routes
* Résolution des flags
* Résolution des alias
* Validation des règles parser

#### EventsManager

Couverture :

* Création des événements
* Propagation
* Événements terminaux
* Intégration runtime

#### SnapshotService

Couverture :

* Génération des snapshots
* Génération des index
* Cohérence interne

#### RuntimeService

Couverture :

* Cycle de vie du runtime
* Exécution des hooks
* Transitions de phases

#### HelpManager

Couverture :

* Résolution des routes d'aide
* Génération des usages
* Gestion des erreurs

---

## Philosophie de test

L'objectif n'est pas de maximiser le nombre de tests.

L'objectif est de maximiser la confiance dans le runtime.

Les tests doivent valider les contrats.

Les tests ne doivent pas imposer une implémentation.

Dans la mesure du possible :

* Tester les comportements
* Tester les sorties
* Tester les APIs publiques

Éviter les dépendances aux détails internes d'implémentation.

---

## Critères de validation de release

v0.1-rc.1

Conditions :

* Tous les tests implémentés sont verts
* Validation TypeScript verte
* Validation ESLint verte
* Validation manuelle du runtime effectuée

Commande de référence :

```bash
pnpm check
```

Résultat attendu :

Tous les contrôles sont validés avec succès.

---

## Notes

De nouveaux tests seront ajoutés progressivement à mesure que de nouveaux cas d'usage, régressions ou besoins apparaîtront dans WSC et les futurs projets KamieLabs.

Ce document représente la stratégie de test de référence pour la première Release Candidate du Core.

---
