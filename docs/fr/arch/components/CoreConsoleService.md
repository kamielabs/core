# 🧱 CoreConsoleService

## Description

`CoreConsoleService` est le service responsable de l’affichage des événements du core dans la console.

Il agit comme un **listener système par défaut**, automatiquement enregistré auprès du `EventsManager`.

Son rôle est de transformer les événements runtime en sorties lisibles, en respectant :

* leur type (`signal` ou `message`)
* leur niveau (`level`)
* leur phase (`phase`)
* la langue active (pour les messages)

Il constitue l’implémentation par défaut du système d’output du core.

---

## But

Le `CoreConsoleService` sert à fournir une sortie console standard pour le core, sans nécessiter de configuration supplémentaire.

Il permet de :

* afficher les événements runtime de manière structurée
* différencier les niveaux (info, warning, error, etc.)
* intégrer automatiquement l’i18n pour les messages
* fournir un comportement cohérent par défaut

Son objectif est simple :

> offrir une visibilité immédiate du runtime, basée uniquement sur le système d’événements.

---

## Pourquoi ce service existe

Le core repose entièrement sur un système d’événements.

Mais sans un output par défaut, ces événements resteraient invisibles.

`CoreConsoleService` existe donc pour :

* donner une représentation concrète des événements
* fournir un comportement par défaut sans configuration
* servir de base pour des systèmes d’output plus avancés

Il démontre aussi un principe clé du core :

> les sorties ne sont pas codées en dur, elles sont pilotées par des listeners.

---

## Enregistrement automatique

Le service s’enregistre lui-même comme listener système lors de son initialisation.

```ts
this.ctx.events.registerSystemListener("*", { handler: this.print, channel: "default" });
```

Cela signifie :

* il écoute tous les événements (`*`)
* il agit sur le channel `default`
* il est actif sans intervention du développeur

Ce mécanisme est un exemple direct de la puissance du système :

> un service peut s’intégrer entièrement au runtime simplement en s’enregistrant comme listener.

---

## Portée

En v0.1, `CoreConsoleService` est responsable de :

* écouter les événements runtime
* filtrer selon le niveau configuré
* formater les événements
* afficher les signaux
* traduire et afficher les messages
* appliquer un rendu différent selon le niveau

Il ne fait pas :

* de logique métier
* de gestion du flow
* de décision runtime
* de stockage d’événements

Il consomme uniquement ce que produit `EventsManager`.

---

## Filtrage par niveau

Le service applique un filtrage basé sur un niveau minimum :

```ts
if (event.level < this._displayLevel) {
  return;
}
```

Ce niveau est défini via les settings du core.

Cela permet de :

* réduire le bruit
* adapter la verbosité
* contrôler l’affichage global

---

## Format des événements

Chaque événement est transformé en une sortie structurée.

### Format de base

```text
[HH:MM:SS] LEVEL   PHASE
```

Avec :

* timestamp
* niveau
* phase

---

### Signals

Les `signal` affichent :

* le code de l’événement
* un label éventuel
* des détails optionnels

Exemple :

```text
[12:00:00] INFO    BOOTSTRAP bootstrapInit (System) [Gentoo Linux]
```

---

### Messages

Les `message` passent par le système i18n :

```ts
const msg = await this.ctx.i18n.tr(event.code, event.values);
```

Puis sont affichés sous forme :

* contenu simple
* ou titre + description

Exemple :

```text
[12:00:00] ERROR   MODULES Module not found
→ The module "user" does not exist
```

---

## Couleurs et niveaux

Le service applique des styles visuels selon le niveau :

* `trace` / `debug` → console.debug
* `info` → console.info
* `warning` → console.warn (jaune)
* `error` → console.error (rouge)
* `fatal` → console.error (fond rouge)

Cela permet une lecture rapide du runtime.

---

## Différence signal / message

Le comportement dépend du type d’événement.

### Signal

* pas de traduction
* affichage direct
* utilisé même sans i18n

### Message

* passe par `I18nManager`
* utilise les valeurs dynamiques
* dépend de la langue runtime

Cela respecte le design global du core.

---

## Relation avec l’i18n

Le service dépend directement de `I18nManager` pour afficher les messages.

Cela implique :

* avant i18n → seuls les `signal` sont fiables
* après i18n → les `message` deviennent exploitables

Le service s’adapte automatiquement à cet état.

---

## Channels et extensibilité

`CoreConsoleService` utilise le channel `"default"`.

Grâce au système de channels :

* un listener runtime peut override ce comportement
* un autre système d’output peut remplacer la console
* plusieurs sorties peuvent coexister

Exemple :

* logger custom
* fichier de log
* output JSON
* UI

👉 C’est un point clé :

> la console n’est qu’une implémentation parmi d’autres.

---

## Rationalité

Le design repose sur un principe fort :

> le core ne “print” jamais directement, il émet des événements.

Et :

> l’affichage est entièrement géré par des listeners.

Cela permet :

* de découpler logique et output
* de remplacer facilement le système d’affichage
* de construire des outputs avancés sans toucher au core
* de rendre le runtime observable et extensible

`CoreConsoleService` est simplement l’implémentation par défaut de ce principe.

---

## Relations

### Avec `EventsManager`

Le service dépend entièrement de lui :

* pour recevoir les événements
* pour s’enregistrer comme listener

### Avec `I18nManager`

Utilisé pour traduire les messages.

### Avec les settings du core

Utilisé pour définir le niveau d’affichage.

### Avec les autres services

Peut être remplacé ou complété par d’autres systèmes d’output via les channels.

---

## Limitations actuelles

En v0.1 :

* le format est encore simple
* le timestamp est en UTC
* pas de configuration avancée du rendu
* pas de gestion multi-output avancée
* pas de format structuré (JSON, etc.)

Ces choix sont volontaires pour garder une base simple et lisible.

---

## Évolutions futures

Les évolutions possibles incluent :

* support du timezone système
* formats de sortie configurables
* output structuré (JSON, logs)
* intégration avec des loggers externes
* gestion avancée des channels
* multiplexage des outputs
* revue la manière dont un signal et un message sont affichés (details pour signal, et version complète pour message)

Le but est d’enrichir sans casser le principe fondamental.

---

## Conclusion

`CoreConsoleService` est l’implémentation par défaut du système d’output du core.

Il illustre parfaitement un principe clé de l’architecture :

> tout passe par les événements, y compris l’affichage.

Simple en apparence, il repose sur un système puissant :

* listeners
* channels
* séparation complète entre émission et affichage

C’est cette approche qui permet au core d’être à la fois :

* lisible par défaut
* extensible sans friction

---
