# 🧱 StagesManager

## Description

`StagesManager` est le deuxième manager du runtime exécuté par le core, juste après `BootstrapManager`.

Son rôle est de résoudre le **stage actif** du CLI, de charger sa configuration persistante, d’en extraire les options runtime, puis de produire les `RuntimeStageFacts`.

Il constitue la première couche de configuration structurée du runtime.

En v0.1, il permet principalement de définir :

* le fichier d’environnement du stage
* la langue utilisée par l’i18n
* les options personnalisées du stage

Cette résolution est déterministe et s’appuie sur un ordre strict de priorité entre valeurs par défaut, valeurs de fichier et variables d’environnement.

---

## But

Le `StagesManager` sert à transformer un contexte d’exécution brut en un **contexte de stage résolu**.

Il permet de répondre à des questions structurantes très tôt dans le runtime :

* dans quel stage le CLI s’exécute-t-il ?
* quel fichier d’environnement doit être chargé ?
* quelle langue doit être utilisée ?
* quelles options de stage sont actives à l’exécution ?
* quelles personnalisations runtime doivent être appliquées avant la suite de la résolution ?

Son objectif est donc de produire un premier niveau de configuration stable, lisible et typé, sur lequel les autres managers pourront s’appuyer.

---

## Pourquoi ce manager existe

Le bootstrap récupère uniquement l’environnement tel qu’il existe au moment du lancement.

Mais cela ne suffit pas pour piloter correctement un CLI sérieux.

Avant d’entrer dans la résolution des globals, du parser, des modules ou des actions, le core doit d’abord savoir dans **quel mode d’exécution logique** il fonctionne.

`StagesManager` existe pour introduire cette couche de structuration.

Il permet de :

* sélectionner un stage actif
* charger un fichier d’environnement associé
* résoudre les options de ce stage
* exécuter un éventuel hook de stage
* produire des facts de stage cohérents pour le reste du runtime

En pratique, il sert à différencier proprement plusieurs contextes d’usage d’un même CLI, par exemple :

* développement
* production
* sandbox
* environnement local spécifique
* autre mode custom défini par le développeur

---

## Portée

En v0.1, `StagesManager` est responsable de :

* déterminer le stage actif
* charger le fichier d’environnement du stage
* résoudre les options du stage
* appliquer les surcharges builtin du stage par défaut
* exécuter la validation interne minimale du stage
* exécuter un hook utilisateur éventuel
* produire les `RuntimeStageFacts`

Il ne fait pas :

* de logique métier applicative
* de mutation libre des facts déjà résolus
* de sélection multi-plateforme avancée
* de gestion complexe des chemins au-delà du comportement actuel
* de résolution globale du runtime final à lui seul

Son périmètre est centré sur la **configuration d’environnement du runtime**.

---

## Rôle des stages

Les stages permettent de définir différents contextes d’exécution pour un même CLI.

Le core fournit par défaut un stage builtin obligatoire, utilisé comme base minimale pour résoudre :

* le fichier de configuration persistant
* la langue
* les options standard du stage

Ce stage par défaut peut rester invisible dans les usages simples, mais il constitue malgré tout une brique fondamentale du runtime.

Le développeur peut :

* lui attribuer un nom plus explicite
* le surcharger partiellement
* ajouter d’autres stages personnalisés

Le but est de pouvoir adapter proprement le comportement du CLI selon le contexte d’exécution.

Exemple concret :

* un stage `dev` peut activer une sandbox ou un répertoire de travail spécifique
* un stage `prod` peut utiliser un autre fichier d’environnement et désactiver cette logique

---

## Sélection du stage actif

Le stage actif est déterminé à partir d’une variable spéciale :

`_NODE_CLI_STAGE`

Son comportement est simple :

* si la variable est absente ou vide, le stage par défaut est sélectionné
* si elle correspond au nom du stage par défaut, ce stage builtin est utilisé
* sinon, le core tente de résoudre le stage correspondant

Cette variable peut être injectée par un outil de build ou d’exécution, par exemple pour forcer automatiquement le stage final d’une CLI construite.

Cela permet de connecter proprement le runtime du core à des workflows externes, sans casser son modèle déterministe.

---

## Ordre de résolution des valeurs

Les options du stage sont résolues selon un ordre strict d’override :

* valeur par défaut
* valeur surchargée par le core pour le stage builtin
* valeur provenant du fichier d’environnement du stage
* valeur provenant des variables d’environnement inline du CLI

Autrement dit :

> `default < override builtin < ENV file < ENV inline`

Cet ordre garantit que la valeur finale d’une option est toujours déterminée de manière prévisible.

C’est un point central du design du manager.

---

## Ce que produit ce manager

Le manager produit un bloc `RuntimeStageFacts` contenant notamment :

### Nom du stage actif

Le nom du stage effectivement résolu.

### Fichier d’environnement

Le chemin du fichier d’environnement associé au stage.

### Options résolues

L’ensemble des options du stage, après application de toutes les règles de priorité.

Ces options sont stockées sous leur forme runtime finale, avec leurs valeurs déjà converties selon leur type attendu.

---

## Comportement interne

La résolution suit une séquence claire :

1. déterminer le nom du stage actif
2. vérifier que le stage existe dans le dictionnaire
3. vérifier qu’un fichier est associé au stage
4. charger le fichier d’environnement
5. résoudre chaque option selon l’ordre de priorité défini
6. construire un brouillon de `RuntimeStageFacts`
7. appliquer les surcharges builtin éventuelles
8. émettre l’événement de hooking du stage
9. exécuter la validation interne du core
10. exécuter le hook utilisateur éventuel
11. figer le dictionnaire
12. marquer le manager comme résolu

Le résultat final est ensuite injecté dans le runtime comme facts de stage.

---

## Validation interne

Avant l’exécution du hook utilisateur, le manager applique une validation interne minimale via un hook invariant du core.

En v0.1, cette validation porte notamment sur :

* `lang`, qui doit être définie et non vide
* `workingDir`, qui doit exister s’il est renseigné

Cette validation est exécutée systématiquement, indépendamment de la présence ou non d’un hook utilisateur.

Elle garantit que certains invariants de base sont respectés avant la suite du lifecycle.

---

## Hooks et personnalisation

`StagesManager` est le premier manager du runtime à proposer une vraie capacité de hooking.

Un hook de stage peut être enregistré pour :

* le stage builtin par défaut
* un stage personnalisé

Ce hook est exécuté **après résolution des options** et **après validation interne du core**.

Il permet d’agir sur la configuration résolue du stage, dans un cadre contrôlé.

Le but principal de ce mécanisme est de permettre des ajustements runtime contextuels, par exemple :

* gérer une sandbox
* ajuster le répertoire de travail final via un outil du core
* émettre des signaux internes
* brancher une logique d’environnement spécifique au stage courant

---

## Contexte fourni au hook

Le hook reçoit un contexte structuré contenant :

### `options`

La liste des options résolues du stage, avec leurs valeurs runtime finales.

Ces valeurs représentent la vérité de résolution du stage au moment du hook.

### `runtime`

Une vue en lecture seule du runtime connu jusque-là, c’est-à-dire le bootstrap et le stage courant.

### `snapshot`

Le dictionnaire complet déclaré à l’initialisation, entièrement typé, incluant builtins, customs et index internes.

### `tools`

Les outils exposés par le core pour permettre certaines actions contrôlées.

En v0.1, le contexte de stage expose principalement :

* `setCwd()`
* `signal()`

---

## Limites du hook de stage

Le hook de stage n’est pas un point de mutation libre.

Il peut :

* lire les valeurs résolues du stage
* utiliser les outils autorisés par le core
* agir sur certains aspects du runtime final via ces outils contrôlés

Il ne peut pas :

* modifier directement les facts résolus du manager
* remplacer librement les valeurs runtime déjà figées
* contourner les invariants internes du core

Certaines valeurs comme `file` ou `lang` peuvent être lues dans le contexte, mais ne doivent pas être vues comme des points de surcharge libre du runtime de stage lui-même.

Autrement dit :

> le hook agit autour du runtime, pas contre la résolution du manager.

---

## Rationalité

Le `StagesManager` existe pour créer une séparation nette entre :

* l’environnement brut récupéré par le bootstrap
* l’environnement logique et configuré utilisé par le runtime

Cette séparation est importante.

Sans elle, le core devrait lire des variables d’environnement ou des fichiers de configuration dans plusieurs briques différentes, ce qui rendrait le système :

* plus flou
* plus difficile à tester
* plus difficile à typer
* moins déterministe

Avec `StagesManager`, le core centralise cette responsabilité très tôt, puis transmet un bloc de facts unique à la suite du lifecycle.

Le hooking de stage suit la même logique : il n’est autorisé qu’après résolution, afin que toute personnalisation s’appuie sur des valeurs déjà stabilisées.

---

## Relations

### Avec `BootstrapManager`

`StagesManager` s’exécute immédiatement après le bootstrap.

Il s’appuie sur les informations déjà disponibles dans l’environnement d’exécution, notamment les variables système et le contexte de lancement.

### Avec `RuntimeService`

Les facts produits par le manager sont injectés dans le runtime global et servent de base aux phases suivantes.

Le hook peut également utiliser des outils exposés par le runtime pour effectuer certaines mutations contrôlées sur le runtime final.

### Avec `I18nManager`

La langue résolue au niveau du stage constitue une information structurante pour l’i18n.

Le stage est donc une étape clé dans la mise en place du runtime localisé.

### Avec les managers suivants

Les managers suivants ne devraient pas relire eux-mêmes les variables d’environnement du stage ou son fichier de configuration.

Ils doivent s’appuyer sur les `RuntimeStageFacts` déjà produits.

Cela garantit une seule source de vérité pour cette phase.

### Avec `EventsManager`

Le manager émet différents événements internes durant sa résolution, notamment pour :

* signaler le début du hooking
* remonter les erreurs de langue
* remonter les erreurs de répertoire de travail
* signaler un stage introuvable
* signaler un fichier de stage manquant

---

## Index internes

Le manager construit également des index internes à partir du dictionnaire des stages.

Ces index servent principalement à :

* retrouver rapidement un stage par son nom
* associer des variables d’environnement à leurs options de stage
* garantir l’unicité des clés d’environnement dans un même stage

Cette étape est effectuée dès la construction du manager.

Elle ne fait pas partie de la résolution runtime elle-même, mais prépare le manager à résoudre rapidement et proprement les stages au moment de l’exécution.

---

## Limitations actuelles

En v0.1, l’implémentation reste volontairement simple sur plusieurs points.

Les limites connues incluent notamment :

* usage direct de `fs` encore présent
* absence de couche de normalisation avancée des chemins
* gestion encore simple des chemins relatifs, du `~` et de l’expansion d’environnement
* détection builtin encore partiellement liée à l’état des hooks enregistrés
* validation du répertoire de travail encore minimaliste
* nom du stage par défaut encore partiellement figé autour de `default`

Ces points sont connus et déjà identifiés pour les versions futures.

---

## Évolutions futures

Les évolutions prévues incluent notamment :

* abstraction complète de l’accès au système de fichiers via les helpers du core
* meilleure normalisation et validation des chemins
* détection builtin plus propre et moins couplée
* configurabilité complète du nom du stage par défaut
* ajout de traces de debug sur la résolution des options
* éventuel découpage interne de `resolve()` si la complexité augmente

À plus long terme, le but reste de garder un manager :

* strict
* déterministe
* typé
* facilement extensible
* mais sans logique implicite

---

## Conclusion

`StagesManager` est la première vraie couche de configuration du runtime.

Là où `BootstrapManager` observe l’environnement brut, `StagesManager` commence à lui donner une structure logique exploitable par le core.

Il résout le stage actif, charge son environnement, stabilise ses options, applique les validations minimales du core, puis ouvre un premier point d’extension contrôlé via les hooks.

C’est cette combinaison entre résolution stricte et personnalisation encadrée qui en fait une brique essentielle du lifecycle.

---
