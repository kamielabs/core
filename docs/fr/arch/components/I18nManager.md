# 🧱 I18nManager

## Description

`I18nManager` est le manager du runtime chargé de résoudre et d’exposer le système de traduction interne du core.

Il devient utilisable uniquement une fois que la langue a été résolue et figée par le `StagesManager`.

Son initialisation est déclenchée automatiquement par le `RuntimeService`, juste après la résolution du stage.
Comme pour le parser, les engines n’ont aucune connaissance directe de cette brique.

Son rôle est de :

* charger les traductions déclarées
* construire les index internes de résolution
* sélectionner la langue active
* définir une langue de fallback
* exposer une méthode de traduction exploitable par le reste du core

---

## But

Le `I18nManager` sert à fournir un système de traduction interne simple, stable et directement utilisable par les outils du core.

Il permet notamment :

* d’émettre des messages localisés
* de fallback proprement vers une langue de référence
* d’injecter dynamiquement des valeurs dans les messages
* de détecter certaines incohérences de traduction

Son objectif est de garantir que, dès que la langue runtime est connue, les messages du core puissent être résolus de manière fiable.

---

## Pourquoi ce manager existe

Le core ne doit pas dépendre d’un système externe pour traduire ses propres messages.

Il a besoin d’une brique interne capable de :

* centraliser les traductions
* fournir un accès uniforme aux messages
* gérer les fallback
* signaler les incohérences connues

`I18nManager` existe donc pour isoler cette responsabilité dans une couche dédiée, simple à raisonner et totalement intégrée au runtime.

Il sert aussi de point de liaison entre :

* la langue résolue par le stage
* les événements de type message
* les tools exposés aux hooks et au runtime final

---

## Portée

En v0.1, `I18nManager` est responsable de :

* construire les index de traduction
* sélectionner la langue active
* définir `en` comme fallback
* vérifier les incohérences structurelles entre langues
* exposer la méthode `tr()`
* injecter les valeurs dynamiques dans les messages
* remonter certains défauts via les événements internes

Il ne fait pas :

* de validation stricte des traductions à partir des événements déclarés
* de liaison forte entre définitions d’événements message et dictionnaires de langues
* de logique métier applicative
* de personnalisation par hook

Son périmètre reste volontairement simple et centré sur la traduction du core.

---

## Dépendances préalables

`I18nManager` ne peut être résolu qu’une fois que la langue du runtime est connue.

Cette langue est définie au niveau du stage, puis figée avant son initialisation.

Le manager dépend donc directement :

* du `StagesManager` pour connaître `lang`
* du `RuntimeService` pour être déclenché au bon moment

Les engines n’interagissent jamais directement avec lui.

---

## Source de vérité

En v0.1, le système repose sur une source de vérité unique : la langue `en`.

Autrement dit :

* toutes les clés présentes en `en` définissent le référentiel attendu
* les autres langues doivent s’aligner sur ces clés
* le fallback s’effectue toujours vers `en`

Cette approche est volontairement simple.

Elle évite, dans la première version, de lier directement les déclarations d’événements de type message avec le contenu exact de chaque dictionnaire de traduction.

Cela permet de garder un système léger, tout en couvrant le besoin principal du core.

---

## Conséquences de ce design

Ce choix implique plusieurs comportements importants :

* une langue peut être incomplète sans bloquer totalement le runtime
* une clé absente dans la langue active peut fallback vers `en`
* une clé absente même en `en` ne peut pas être résolue correctement
* une clé inconnue dans une langue autre que `en` est considérée comme une incohérence structurelle

Ce dernier point est important : une clé inconnue ne peut pas être correctement rattachée au référentiel du core, donc aucun fallback fiable n’est possible.

Dans ce design, ce cas est bloquant et doit le rester.

---

## Ordre de résolution

La résolution suit une logique simple :

1. émettre un événement d’initialisation i18n
2. récupérer la langue runtime depuis le stage
3. définir `en` comme langue de fallback
4. vérifier que `en` existe bien
5. comparer toutes les autres langues au référentiel `en`
6. construire les facts runtime i18n
7. figer le dictionnaire
8. marquer le manager comme résolu
9. émettre l’événement `i18nReady`

---

## Ce que produit ce manager

Le manager produit un `RuntimeI18nFacts` contenant notamment :

* `lang` : la langue active
* `fallback` : la langue de fallback
* `index` : les messages disponibles dans la langue active
* `fallbackIndex` : les messages disponibles dans la langue de fallback

Ces facts deviennent ensuite la base utilisée pour résoudre tous les messages du core.

---

## Index internes

Le manager construit deux index principaux à partir du dictionnaire des traductions.

### Index par langue

Il permet de retrouver rapidement un message à partir de :

* sa langue
* son code

### Index par code

Il permet de retrouver un même code de message dans plusieurs langues.

Ces index sont construits une seule fois à l’initialisation du manager, puis figés.

---

## Validation structurelle

En v0.1, `I18nManager` applique une validation simple mais utile à partir de `en`.

Pour chaque langue autre que `en`, il détecte :

### Clés manquantes

Ce sont les clés présentes en `en` mais absentes de la langue courante.

Dans ce cas :

* le runtime peut continuer
* le fallback vers `en` reste possible
* un événement interne est émis

### Clés inconnues

Ce sont les clés présentes dans la langue courante mais absentes de `en`.

Dans ce cas :

* le runtime considère qu’il s’agit d’une incohérence bloquante du référentiel
* un événement d’erreur est émis
* aucun fallback fiable n’est possible pour ces clés

Ce comportement est volontaire et cohérent avec le design actuel.

---

## Fallback

Le fallback est un comportement central du manager.

Lorsqu’un message n’existe pas dans la langue active :

* le manager tente de le retrouver dans `en`
* si le message existe en `en`, il est utilisé
* un événement interne signale l’utilisation du fallback

Cela permet au core de rester fonctionnel même si une langue secondaire est incomplète.

En revanche, si le message n’existe pas non plus en `en`, le système considère qu’il manque au référentiel lui-même.

---

## Méthode de traduction

Le manager expose une méthode `tr()` qui constitue l’interface de traduction du core.

Cette méthode :

* vérifie que le manager est bien résolu
* cherche le message dans la langue active
* fallback vers `en` si nécessaire
* injecte les valeurs dynamiques si besoin
* retourne un message prêt à être consommé

Elle peut produire :

* un message simple avec `content`
* un message complet avec `title` et `description`

---

## Injection de valeurs

Le manager supporte l’injection de valeurs dynamiques dans les messages.

Les placeholders sont remplacés à partir d’un dictionnaire de valeurs fourni à `tr()`.

Exemple :

* `{name}`
* `{path}`
* `{lang}`

Si une valeur attendue est absente :

* un événement interne est émis
* le placeholder est conservé tel quel dans le texte

Ce comportement permet de conserver un rendu lisible sans masquer le défaut détecté.

---

## Comportement en cas d’erreur

Le manager suit une logique de fallback au moindre souci, sauf dans un cas précis : les clés inconnues ou totalement introuvables dans le référentiel.

En pratique :

* langue manquante → fallback
* message manquant dans la langue active → fallback
* valeur d’injection absente → signalement, mais continuité
* message introuvable même en `en` → erreur structurelle forte
* clé inconnue hors référentiel `en` → comportement bloquant via signal d’erreur

Autrement dit :

> tant qu’un fallback fiable existe, le core continue ; dès que le référentiel lui-même devient incohérent, le flow doit être interrompu.

---

## Rationalité

Le design actuel de `I18nManager` est volontairement pragmatique.

Il cherche à répondre à un besoin simple :

* le core doit pouvoir traduire ses propres messages
* sans dépendre d’une architecture plus lourde
* tout en gardant un comportement déterministe

Le choix de `en` comme source de vérité est une solution simple, efficace et suffisante pour la v0.1.

Ce n’est pas le design final idéal, mais c’est un design cohérent, stable et facile à faire évoluer.

---

## Relations

### Avec `StagesManager`

Le manager dépend directement du stage, qui fournit la langue active du runtime.

Sans stage résolu, l’i18n ne peut pas être initialisé correctement.

### Avec `RuntimeService`

Le `RuntimeService` déclenche automatiquement sa résolution au bon moment.

Cette orchestration reste implicite pour les engines.

### Avec `EventsManager`

L’i18n émet plusieurs événements internes pendant sa résolution et son utilisation :

* initialisation
* fallback utilisé
* clés manquantes
* clés inconnues
* valeurs d’injection absentes
* fatal i18n
* i18n prêt

### Avec les tools du core

Une fois l’i18n résolu, certains tools comme `message()` deviennent disponibles dans les hooks et dans les phases runtime concernées.

### Avec les autres managers

Les autres managers ne manipulent pas directement la structure interne des traductions.

Ils consomment uniquement le service de traduction ou les messages déjà résolus via les outils du core.

---

## Limitations actuelles

En v0.1, plusieurs limites sont connues et assumées :

* la source de vérité repose uniquement sur la langue `en`
* les dictionnaires de traduction ne sont pas encore liés formellement aux événements message déclarés
* la validation reste structurelle et non encore contractuelle
* l’absence de certaines clés est tolérée via fallback, tant que `en` reste cohérent
* aucun système de hook ou de personnalisation i18n n’est prévu à ce stade

La principale évolution attendue concerne la liaison forte entre :

* les événements de type message
* les traductions attendues dans toutes les langues

---

## Évolutions futures

Les évolutions futures devraient notamment inclure :

* un rework du lien entre traductions et événements message
* une validation plus stricte de la cohérence globale du système i18n
* une meilleure garantie d’équivalence entre builtins, customs et dictionnaires de langues
* un raffinement éventuel des diagnostics i18n

L’objectif sera de faire évoluer ce système simplifié vers un contrat plus fort, sans perdre la simplicité d’usage actuelle.

---

## Conclusion

`I18nManager` est la brique du runtime qui rend les messages du core réellement exploitables dans la langue active.

Il s’appuie sur une règle simple :

> `en` définit le référentiel, les autres langues s’y alignent, et le fallback est utilisé tant que ce référentiel reste cohérent.

Cette approche volontairement pragmatique permet au core de disposer dès la v0.1 d’un système i18n fiable, simple à raisonner, et suffisamment strict pour bloquer les incohérences réellement dangereuses.

---
