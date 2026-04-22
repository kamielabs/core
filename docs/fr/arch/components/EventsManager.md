# 🧱 EventsManager

## Description

`EventsManager` est la première classe initialisée par le core et la première brique disponible dans le contexte global.

Il est accessible dès l’initialisation, avant même le début du runtime, et reste ensuite disponible pour tous les managers, services, engines et autres classes intégrées au core.

Son rôle est de centraliser tout le système événementiel du framework.

En v0.1, il gère deux types d’événements :

* `signal`
* `message`

Chaque événement porte obligatoirement :

* un `kind`
* un `phase`
* un `level`

`EventsManager` ne sert pas uniquement à émettre ou stocker des événements.
Il constitue aussi le socle du système de listeners, du routage par channel, du pilotage de flow et du contrôle de terminaison du runtime.

---

## But

Le `EventsManager` sert à fournir un système événementiel unifié, exploitable par tout le core.

Il permet de :

* déclarer et émettre des événements typés
* enregistrer l’historique runtime des événements émis
* indexer les événements par type, niveau et phase
* écouter des événements sur plusieurs couches logiques
* gérer les sorties runtime via des listeners par channel
* déclencher certaines transitions de flow
* interrompre le runtime sur erreur ou fatal

Son objectif est de fournir une base commune à la fois pour :

* l’observabilité du core
* la communication runtime
* l’orchestration event-driven

---

## Pourquoi ce manager existe

Le core est construit autour d’un modèle fortement piloté par événements.

Les événements ne servent pas seulement à “logguer” ce qu’il se passe.
Ils servent aussi à faire circuler l’état du runtime, à déclencher certaines réactions et à piloter certains moteurs comme le `FedEngine`.

`EventsManager` existe donc pour centraliser plusieurs responsabilités fondamentales :

* émission d’événements
* stockage live des événements runtime
* dispatch vers des listeners
* gestion des channels de sortie
* déclenchement de flow
* terminaison automatique sur événements critiques

Sans cette brique, le core perdrait :

* sa cohérence d’orchestration
* sa capacité d’observation unifiée
* sa capacité à piloter un runtime vraiment event-driven

---

## Portée

En v0.1, `EventsManager` est responsable de :

* exposer le dictionnaire d’événements final
* créer les événements runtime avec identifiant et timestamp
* stocker l’historique des événements
* indexer les événements live
* enregistrer et retirer des listeners
* supporter des listeners simples, wildcard et `once`
* gérer les listeners système, flow et runtime
* router les sorties via des channels
* dispatcher les événements selon le moteur actif
* interrompre le flow sur erreur ou fatal

Il ne fait pas :

* la traduction elle-même des messages
* la logique métier des actions
* la résolution du runtime
* le choix du moteur

Il fournit cependant une base utilisée par pratiquement toutes ces briques.

---

## Types d’événements

En v0.1, le core supporte deux types d’événements :

### `signal`

Un `signal` transporte principalement une information technique ou structurelle liée au runtime.

Il peut notamment contenir :

* des `details`

Tant que la langue n’est pas disponible, c’est le seul type d’événement réellement exploitable.

### `message`

Un `message` représente un événement traduisible, destiné à produire un contenu localisé.

Il peut notamment contenir :

* des `values` injectées dans le message

Les `message` ne doivent être utilisés qu’une fois l’i18n résolu.

---

## Niveaux et phases

Chaque événement porte obligatoirement :

* un niveau (`level`)
* une phase (`phase`)
* un type (`kind`)

Ces métadonnées structurent tout le système.

### Le niveau

Le niveau permet de qualifier la gravité ou la nature de l’événement.

Exemples typiques :

* trace
* debug
* info
* warning
* error
* fatal

Les niveaux `error` et `fatal` ont un impact direct sur la terminaison du flow.

### La phase

La phase indique à quel moment du lifecycle l’événement a été émis.

Elle permet de rattacher chaque événement à une étape du core, par exemple :

* déclarative
* bootstrap
* stage
* parser
* globals
* modules
* single
* runtime

### Le type

Le type distingue :

* les signaux techniques
* les messages traduisibles

---

## Disponibilité dans le runtime

`EventsManager` est la première brique vivante du core.

Il est disponible :

* dès l’initialisation
* avant le runtime
* pendant tout le runtime
* jusque dans les hooks et l’exécution métier

En revanche, les capacités réellement utilisables évoluent avec l’état du runtime.

Avant la résolution de la langue :

* seuls les `signal` sont sûrs à utiliser

Après la résolution de l’i18n :

* les `message` deviennent disponibles

Cette distinction est structurante dans le design du core.

---

## Ce que produit ce manager

`EventsManager` produit et maintient un état live des événements runtime.

Cet état contient notamment :

* la liste chronologique des événements
* un accès par identifiant
* des index par type
* des index par phase
* des index par niveau

Il ne produit pas un simple snapshot figé : il maintient une vue vivante du système événementiel pendant toute l’exécution.

---

## Historique et index runtime

À chaque émission, le manager :

1. crée un événement runtime
2. lui attribue un identifiant unique
3. lui associe un timestamp
4. l’ajoute à la liste live
5. l’indexe par :

   * type
   * phase
   * niveau

Cela permet ensuite :

* d’accéder à l’historique complet
* de retrouver rapidement certains sous-ensembles d’événements
* d’outiller plus facilement le debug, l’observation et les listeners avancés

---

## Émission d’événements

Le cœur du système repose sur une méthode interne d’émission, utilisée ensuite par les API publiques du manager.

Lorsqu’un événement est émis :

1. la définition déclarée est récupérée dans le dictionnaire
2. un événement runtime est créé
3. les données dynamiques sont injectées selon le type :

   * `details` pour les signaux
   * `values` pour les messages
4. les listeners système et runtime sont dispatchés via les channels
5. les listeners de flow sont éventuellement déclenchés
6. le contrôle terminal est appliqué
7. l’événement runtime est retourné

Cette séquence est la colonne vertébrale du système.

---

## Listeners

Le manager supporte trois grandes catégories de listeners.

### Listeners système

Ils représentent les listeners de base du core, destinés aux sorties et comportements système.

Ils sont toujours pris en compte.

### Listeners de flow

Ils servent à piloter le flow événementiel du runtime.

Ils sont particulièrement importants pour les moteurs comme `FedEngine`.

Ils ne sont déclenchés que dans certaines conditions, notamment :

* moteur `fed` actif
* événement déclaré avec `trigger: true`

### Listeners runtime

Ils représentent les listeners runtime ajoutés dynamiquement, par exemple via des tools ou de futures extensions.

Ils peuvent prendre le dessus sur les listeners système via le mécanisme de channels.

---

## Wildcards et listeners `once`

Le système supporte aussi :

* des listeners ciblés sur un événement précis
* des listeners wildcard (`*`)
* des listeners `once`, automatiquement retirés après leur première exécution

Cela permet une très grande souplesse sans casser le modèle typé du système.

---

## Channels de sortie

Le dispatch des listeners système et runtime s’effectue par **channel**.

C’est une des particularités importantes du manager.

Le système :

1. regroupe les handlers par channel
2. fusionne les channels système et runtime
3. applique une priorité runtime sur système à channel égal

Autrement dit :

* si un listener runtime existe pour un channel donné, il prend la priorité
* sinon, le listener système du même channel est utilisé

Ce mécanisme permet de construire un vrai système d’output par canal, avec surcharge propre au runtime.

C’est ce qui permet notamment de gérer :

* un output système par défaut
* des sorties runtime spécifiques
* des listeners ajoutés dynamiquement par le développeur

---

## Flow et moteurs événementiels

Le système de flow est une autre responsabilité clé du manager.

Certains événements peuvent être déclarés avec un indicateur :

* `trigger: true`

Lorsque c’est le cas, et lorsque le moteur actif est `fed`, l’événement peut déclencher les listeners de flow.

C’est cette mécanique qui permet de construire un moteur comme le `FedEngine`, entièrement piloté par événements.

Dans ce modèle :

* le runtime avance non pas par appels directs, mais par réactions à des événements de flow
* le manager devient donc un composant central d’orchestration

C’est une des raisons pour lesquelles `EventsManager` est une des briques algorithmiques majeures du core.

---

## Contrôle terminal

Le manager gère aussi le contrôle terminal du runtime.

En v0.1 :

* un événement de niveau `error` termine le processus
* un événement de niveau `fatal` termine le processus

Autrement dit :

> l’émission de certains événements ne sert pas seulement à informer, elle peut mettre fin au flow.

Ce point est fondamental dans le design du core.

Le système événementiel n’est pas passif : il a une autorité réelle sur l’exécution.

---

## API principales

Le manager expose plusieurs catégories d’API :

### Enregistrement des listeners

* `registerSystemListener()`
* `registerFlowListener()`
* `registerRuntimeListener()`

### Retrait des listeners

* `offSystemListener()`
* `offFlowListener()`
* `offRuntimeListener()`

### Listeners à usage unique

* `onceSystemListener()`
* `onceFlowListener()`
* `onceRuntimeListener()`

### Émission

* `internalEmit()`
* `emitSignal()`
* `emitMessage()`
* `emit()`

### Lecture du store live

* `get()`
* `getAll()`
* `getEventsByKind()`
* `getEventsByPhase()`
* `getEventsByLevel()`

---

## Contexte d’utilisation

`EventsManager` est utilisé partout dans le core :

* par les managers
* par les services
* par les hooks
* par les tools
* par les engines

Il constitue donc un des éléments les plus transverses de toute l’architecture.

Son omniprésence est voulue : il est le langage commun du runtime.

---

## Rationalité

Le design de `EventsManager` repose sur une idée forte :

> un événement doit pouvoir être à la fois observé, routé, utilisé pour piloter le flow, et éventuellement terminer l’exécution.

Cette approche est plus ambitieuse qu’un simple système de logs.

Elle permet de construire un core :

* observable
* pilotable
* extensible
* compatible avec plusieurs styles d’engine
* cohérent du début à la fin du runtime

C’est aussi pour cela que `EventsManager`, avec `ParserManager` et `ModulesManager`, fait partie des trois grandes briques algorithmiques du core.

Le reste compose autour d’eux ; eux structurent réellement le comportement global du framework.

---

## Relations

### Avec tous les managers et services

`EventsManager` est disponible très tôt et sert de dépendance transversale à tout le reste du core.

### Avec `I18nManager`

L’i18n conditionne l’usage des événements de type `message`.

Avant sa résolution, seuls les `signal` doivent être utilisés.

### Avec les tools

Les tools exposent certaines capacités d’émission ou d’enregistrement de listeners, mais s’appuient sur `EventsManager` pour leur implémentation réelle.

### Avec les engines

Les engines classiques peuvent l’utiliser pour observer ou signaler le flow.

Le `FedEngine`, lui, dépend directement de ses capacités de flow event-driven.

### Avec le runtime output

Le système de channels permet de relier `EventsManager` à toute la gestion des sorties runtime.

---

## Limitations actuelles

En v0.1, certaines limites ou simplifications sont encore présentes :

* la logique de terminaison est encore directement liée à `process.exit`
* la séparation fine entre certaines catégories de sorties peut encore évoluer
* une partie du polish interne est encore à finaliser
* certaines APIs d’émission pourront être rationalisées plus tard
* le couplage avec certains usages futurs du runtime listener system pourra encore être affiné

Ces points n’enlèvent rien à la solidité du design actuel, mais ils font partie des zones naturelles d’amélioration.

---

## Évolutions futures

Les évolutions futures pourront notamment concerner :

* le raffinement du contrôle terminal
* la clarification de certaines APIs d’émission
* l’évolution du système de channels
* l’extension du pilotage event-driven
* l’amélioration de l’intégration avec les futurs plugins et outils avancés

Le cœur du design, lui, devrait rester inchangé :

* événements typés
* dispatch structuré
* flow pilotable
* terminaison contrôlée

---

## Conclusion

`EventsManager` est la brique la plus transverse et l’une des plus importantes du core.

Il ne se contente pas de stocker ou diffuser des événements.
Il fournit un véritable système vivant capable de :

* tracer le runtime
* router les sorties
* notifier le système
* déclencher le flow
* interrompre l’exécution si nécessaire

C’est cette combinaison entre observabilité, orchestration et contrôle qui en fait un des piliers majeurs du framework.

---
