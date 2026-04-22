# 🧱 GlobalsManager

## Description

`GlobalsManager` est le manager du runtime chargé de résoudre les **options globales** du CLI.

Il s’exécute après `StagesManager`, une fois que :

* le stage actif a été résolu
* l’i18n a été initialisé
* le parser a été préparé pour la suite de la résolution

Son rôle est de produire les `RuntimeGlobalsFacts` à partir de plusieurs sources de valeurs, selon un ordre strict de priorité.

Les options globales ont une nature particulière dans le core : elles sont à la fois :

* liées à une variable d’environnement
* exposables sous forme de flags CLI

Elles constituent donc un pont entre configuration persistante, environnement système et ligne de commande.

---

## But

Le `GlobalsManager` sert à résoudre tous les **flags globaux du CLI** et à stabiliser leur valeur runtime finale.

Il permet de répondre à des questions transverses au CLI, avant d’entrer dans la résolution du module, de l’action ou des arguments.

Son objectif est de fournir un bloc global unique, cohérent et typé, qui pourra être utilisé par le reste du runtime comme source de vérité pour les options globales.

---

## Pourquoi ce manager existe

Les options globales occupent une place particulière dans le core.

Elles ne sont ni de simples options de stage, ni des flags liés à un module ou à une action.

Elles définissent un niveau transversal du CLI, utilisable quel que soit le contexte fonctionnel ensuite choisi.

`GlobalsManager` existe donc pour isoler cette responsabilité dans une phase dédiée.

Il centralise :

* la résolution des variables d’environnement globales
* la lecture éventuelle du fichier d’environnement du stage
* l’intégration des surcharges issues des flags CLI globaux
* l’exposition des valeurs globales finales au runtime

Cela évite de disperser la logique de résolution globale dans plusieurs briques du core.

---

## Portée

En v0.1, `GlobalsManager` est responsable de :

* valider la cohérence des variables d’environnement globales
* construire les index nécessaires à la résolution
* demander au parser de résoudre la phase des flags globaux
* résoudre les valeurs finales des options globales
* exécuter un hook global éventuel
* produire les `RuntimeGlobalsFacts`

Il ne fait pas :

* la résolution du stage
* l’initialisation de l’i18n
* l’initialisation du parser
* la résolution des modules ou des actions
* de logique métier applicative

Son périmètre est centré sur les **options globales du runtime**.

---

## Nature particulière des options globales

Les options globales sont structurées par **groupes**.

Chaque option globale :

* appartient à un groupe
* référence une variable d’environnement
* peut exposer zéro, un ou plusieurs flags CLI

Tous les flags associés à une même option agissent sur la **même valeur finale**.

Autrement dit, les flags ne créent pas plusieurs options distinctes : ils constituent plusieurs points d’entrée CLI vers une seule et même donnée runtime.

Cette structure permet :

* une organisation plus lisible des globals
* une résolution plus claire
* un typage plus propre
* une meilleure extensibilité

---

## Ordre de résolution des valeurs

Les options globales suivent un ordre strict d’override :

* valeur par défaut
* valeur provenant du fichier d’environnement du stage
* valeur provenant des variables d’environnement runtime
* valeur provenant d’un flag CLI global

Autrement dit :

> `default < ENV file < ENV var < CLI flag`

Cet ordre est déterministe et constitue la règle unique de résolution des globals dans le core.

Le parser n’intervient que sur la dernière couche, celle des flags CLI.

Les couches `ENV file` et `ENV var` sont lues avant cette résolution finale.

---

## Dépendances préalables

Avant l’exécution de `GlobalsManager`, certaines briques sont déjà prêtes.

Après la résolution des stages, le `RuntimeService` déclenche automatiquement :

* la résolution de l’i18n
* l’initialisation du parser

Cela a une conséquence importante :

* le contexte global peut déjà émettre des `message()`, car l’i18n est disponible
* le parser est prêt à résoudre les flags globaux dans la bonne phase runtime

`GlobalsManager` s’inscrit donc dans un runtime déjà partiellement structuré.

---

## Ce que produit ce manager

Le manager produit un bloc `RuntimeGlobalsFacts`.

Ce bloc contient les valeurs finales de toutes les options globales, regroupées selon leur structure déclarative.

Chaque valeur est déjà résolue et stabilisée selon l’ordre de priorité défini par le core.

Ce bloc devient ensuite la source de vérité runtime pour les options globales.

---

## Comportement interne

La résolution suit une séquence claire :

1. valider les collisions éventuelles entre variables d’environnement de stage et globals
2. charger les variables d’environnement déjà connues
3. charger le fichier d’environnement associé au stage actif
4. déterminer la phase suivante du parser
5. demander au parser de résoudre les flags globaux
6. résoudre toutes les valeurs globales selon l’ordre de priorité
7. stocker le résultat dans un brouillon runtime
8. émettre l’événement de hooking global
9. exécuter le hook global éventuel
10. figer le dictionnaire
11. marquer le manager comme résolu

Le résultat final est ensuite injecté dans le runtime comme facts globaux.

---

## Validation interne

Avant la résolution effective des globals, le manager applique une validation minimale.

En v0.1, cette validation vérifie principalement qu’aucune variable d’environnement globale n’entre en collision avec une variable déjà déclarée dans le stage courant.

L’objectif est de préserver une séparation claire entre :

* les variables d’environnement du stage
* les variables d’environnement des globals

Cette règle évite des ambiguïtés de résolution dans le runtime.

---

## Index internes

Le manager construit ses index dès sa création.

Ces index servent principalement à :

* retrouver une option globale à partir d’une variable d’environnement
* retrouver une option globale à partir d’un flag CLI
* garantir l’unicité des clés runtime globales

Deux index principaux sont construits :

### Index des variables d’environnement

Il associe chaque variable d’environnement globale à son groupe et à son option.

### Index des flags CLI

Il associe chaque flag déclaré à son groupe, à son option et à sa définition CLI.

Cet index prend en charge :

* les flags longs
* les flags courts
* les alias éventuels

Ces index ne résolvent rien par eux-mêmes, mais ils préparent une résolution rapide, claire et déterministe.

---

## Relation avec le parser

`GlobalsManager` ne parse pas lui-même la ligne de commande.

Il délègue cette responsabilité au parser.

Le parser reçoit l’index des flags globaux et résout uniquement cette phase du CLI, selon le mode en cours et la phase suivante attendue.

Cela permet au core de conserver une séparation nette entre :

* résolution syntaxique du CLI
* résolution logique des valeurs runtime

En pratique :

* le parser s’occupe des flags
* `GlobalsManager` s’occupe de la vérité runtime finale des globals

---

## Hooks et personnalisation

`GlobalsManager` expose un hook global unique.

Ce hook est exécuté après :

* la résolution des valeurs globales
* l’émission de l’événement de hooking

Il permet d’agir sur les globals résolus dans un cadre contrôlé.

Comme l’i18n est déjà disponible à ce stade, le contexte du hook est plus riche que celui des stages.

---

## Contexte fourni au hook

Le hook reçoit un contexte structuré contenant :

### `options`

Les globals résolus, sous leur forme runtime finale et typée.

### `runtime`

Une vue en lecture seule du runtime déjà connu à ce stade.

Cela inclut notamment :

* le bootstrap
* le stage
* le contexte global en cours de résolution

### `snapshot`

Le dictionnaire complet déclaré à l’initialisation, entièrement typé.

### `tools`

Les outils exposés par le core pour cette phase.

En v0.1, le contexte global donne accès notamment à :

* `signal()`
* `message()`
* `setListener()`

---

## Particularités du hook global

Le hook global ouvre un niveau d’intégration plus avancé que le hook de stage.

En pratique, il permet par exemple :

* d’émettre des signaux internes
* d’émettre des messages localisés, car l’i18n est déjà résolu
* d’enregistrer un listener sur certains canaux runtime
* de connecter proprement des comportements transverses autour des globals

Ce point est important : les globals ne servent pas seulement à porter des valeurs runtime, ils servent aussi souvent à configurer le comportement global du CLI.

Le hook global est justement le point de liaison entre ces valeurs résolues et leur effet réel dans le runtime.

---

## Limites du hook global

Comme pour les autres hooks du core, il ne s’agit pas d’un point de mutation libre.

Le hook peut :

* lire les globals résolus
* utiliser les outils exposés par le core
* brancher certaines réactions runtime contrôlées

Il ne doit pas :

* casser les invariants de résolution
* modifier arbitrairement les facts déjà résolus du manager
* contourner la structure typée des globals

Le principe reste le même que pour les autres managers :

> le hook complète la résolution, il ne remplace pas le manager.

---

## Rationalité

`GlobalsManager` existe pour centraliser une couche du runtime qui est souvent dispersée ou mal définie dans beaucoup de CLI.

Dans ce core, les globals sont traités comme une phase explicite, avec :

* leur propre structure déclarative
* leur propre système d’index
* leur propre ordre de priorité
* leur propre point de hooking

Ce choix apporte plusieurs bénéfices :

* une meilleure lisibilité du runtime
* un comportement plus déterministe
* une meilleure séparation des responsabilités
* un typage plus solide
* une intégration plus propre avec le parser

Cette approche permet aussi d’éviter qu’une logique “globale” se répande de manière implicite dans toutes les autres couches du système.

---

## Relations

### Avec `StagesManager`

`GlobalsManager` dépend directement du stage résolu.

Il utilise notamment :

* le fichier d’environnement du stage actif
* le nom du stage courant
* les informations déjà validées au niveau du runtime de stage

### Avec `RuntimeService`

Les facts globaux produits sont injectés dans le runtime global et servent de base aux étapes suivantes de résolution.

Le contexte runtime exposé au hook global est lui aussi fourni par les services du core.

### Avec `I18nManager`

L’i18n étant déjà résolu à ce stade, le hook global peut utiliser `message()`.

Cela marque une différence importante avec les phases plus précoces du runtime.

### Avec `ParserManager`

`GlobalsManager` dépend du parser pour résoudre les flags CLI globaux.

Il lui fournit les index nécessaires et s’appuie sur son contexte pour récupérer les valeurs finales issues de la ligne de commande.

### Avec les managers suivants

Les managers suivants ne doivent pas re-résoudre eux-mêmes les globals.

Ils doivent s’appuyer sur les `RuntimeGlobalsFacts` déjà produits, afin de conserver une seule source de vérité pour cette phase.

### Avec `EventsManager`

Le manager émet des événements internes durant sa résolution, notamment pour signaler l’entrée dans la phase de hooking.

En v0.1, certaines validations utilisent encore des `throw`, mais cette partie est identifiée comme devant évoluer vers un modèle entièrement piloté par événements.

---

## Limitations actuelles

En v0.1, plusieurs points restent encore simples ou en transition :

* certaines validations utilisent encore des exceptions directes
* la remontée d’erreurs doit encore être harmonisée vers les événements internes
* le hook global reste unique
* la logique de validation est encore volontairement minimale
* certains raffinements du cycle de hook peuvent encore évoluer

Ces limites sont connues et cohérentes avec le périmètre d’une première version stable du core.

---

## Évolutions futures

Les évolutions prévues ou naturelles pour la suite incluent notamment :

* suppression des `throw` restants au profit d’événements internes cohérents
* enrichissement éventuel de la validation des globals
* amélioration du système de hooking global si nécessaire
* raffinement du modèle des listeners runtime
* amélioration continue de la cohérence entre parser, globals et runtime final

Le but reste de conserver un manager :

* strict
* lisible
* déterministe
* typé
* mais assez souple pour brancher proprement des comportements globaux avancés

---

## Conclusion

`GlobalsManager` est la brique du runtime chargée de résoudre tout ce qui est **global au CLI**.

Il transforme une déclaration structurée de variables d’environnement et de flags en un bloc runtime unique, stable et exploitable par le reste du core.

Son rôle ne se limite pas à lire des valeurs : il organise une couche transverse du CLI, la connecte au parser, puis ouvre un point d’extension plus riche grâce à l’i18n déjà disponible.

C’est cette position intermédiaire — entre configuration, parsing et intégration runtime — qui en fait une brique essentielle du lifecycle.

---
