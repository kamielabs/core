# Liste des états du core

## ⚠️ Statut du référentiel

Ce document définit le système de nommage et de structuration des events du core.

⚠️ IMPORTANT :

* Les codes (`X00000`) ne sont **pas encore définitivement assignés**
* Les ranges définis sont **provisoires**
* Les associations event ↔ code sont **susceptibles de changer**

👉 La stabilisation complète sera effectuée dans :

* RFC-0001 (normalisation des codes et CoreError)

Les CoreError non marqués comme `LOCKED` sont considérés comme transitoires.

Ils seront :

* soit supprimés
* soit convertis en events `fatal`

👉 Cette migration sera traitée dans :

* RFC-0001 (normalisation des codes et CoreError)

Ce document doit être considéré comme :
→ une **base de travail structurante**
→ et non un contrat final figé

## Types d'events (kind)

### signal

* Event interne au core
* Ne supporte pas l’i18n

---

### message

* Event interne au core
* Supporte l’i18n
* Peut contenir des valeurs dynamiques pour interpolation

---

## Trigger (flow control)

Chaque event peut définir un flag `trigger`.

* `trigger: true` → l’event peut être utilisé par un engine en mode FED (Full Event Driven) pour piloter le flux d’exécution du runtime
* `trigger: false` → l’event n’est pas utilisé pour le contrôle de flow

---

### Règle fondamentale

Le contrôle du flow NE dépend PAS de :

* `kind` (signal/message)
* `level` (trace → fatal)

Le contrôle du flow dépend UNIQUEMENT de :

* `trigger`

---

### Règle d’exécution

Un event avec `trigger: true` doit être explicitement géré par l’engine.

Sinon, il n’a aucun effet sur le flow d’exécution.

---

### ⚠️ IMPORTANT

Un event de type `message` peut également piloter le flow si `trigger: true`.

Il ne doit pas être considéré uniquement comme un event d’affichage.

---

## Terminal Events (level)

Les events de niveau `error` et `fatal` sont des **TerminalEventsLevel**.

### Comportement

* Ils terminent **immédiatement** l’exécution complète du script
* Ce comportement est **indépendant** de :

  * `trigger`
  * du mode d’engine (std ou fed)
  * du contexte d’exécution (sync ou async)

---

### Règle d’exécution

* Un TerminalEvent est **toujours exécuté en fin de flux** si le process est encore actif
* Il interrompt le runtime dès son émission
* Aucun event suivant ne doit être traité

---

### Objectif

Garantir :

* une terminaison déterministe du runtime
* une cohérence globale du système d’exécution
* l’absence d’états incohérents après erreur critique

---

## 🔒 Politique des CoreError

* Les **CoreError** sont strictement limités à la phase **pré-events** (bootstrap / builders)
* Cette liste est considérée comme **fermée** après l’initialisation de `EventsManager`

---

## Politique des ParserIssue

Les ParserIssue ne sont pas bloquants au moment du parsing.

Ils sont accumulés puis interprétés par le runner.

À terme, les ParserIssue seront supprimées en tant que système interne.

Elles seront remplacées par des events de type `message`
dans une architecture unifiée.

👉 Cette transformation est prévue dans :

* RFC-0004 (Parser → Events refactor)

---

## ⚙️ Après initialisation de EventsManager

* Toutes les anomalies DOIVENT passer par le **système d’events**
* Les conditions fatales DOIVENT :

  * émettre un **event fatal**
  * interrompre le flux d’exécution
* Aucun nouveau **CoreError** ne doit être introduit

---

## 🚨 Règle d’évolution

Si l’introduction d’un nouveau CoreError semble nécessaire :

→ il s’agit d’un **problème de design**

→ la résolution DOIT passer par une **RFC**

---

## Events Codes - Référentiel

* `X` correspond à l'une de ces lettres: `T`, `D`, `I`, `W`, `E`, `F`
* le code est unique malgré que la lettre puisse être differente entre deux codes:
  * `T00001` et `F00001` <- interdit.
  * `T00001` et `F00002` <- autorisé
* c'est le nombre sur 5 digits qui doit être unique et non le code complet.

⚠️ Cette règle sera strictement appliquée lors de l’implémentation finale (RFC-0001)

| code class        | scope                          |
|-------------------|--------------------------------|
| X00001->X00009    | CLI Core                       |
| X00010->X00049    | Core Internals                 |
| X00050->X00099    | Engine Internals               |
| X00100->X00199    | EventsManager Internals        |
| X00200->X00299    | Bootstrap Phase                |
| X00300->X00399    | Stages Phase                   |
| X00400->X00499    | I18n Phase                     |
| X00500->X00599    | Parser Phase                   |
| X00600->X00699    | Globals Phase                  |
| X00700->X00799    | Modules Phase                  |
| X00800->X00899    | Runtime Phase                  |
| X00900->X00999    | Plugins Phase                  |
| X01000->X99998    | User Defined Events            |
| X99999            | Unknown Event                  |

---

## Events Names — Règles

* Tous les events (y compris les CoreError) doivent commencer par `core.`
* Le namespace `^core\..*$` est réservé exclusivement au core
* Chaque event doit suivre un pattern déterministe et cohérent
* Le naming suit une logique formelle et non linguistique.
  * L’ordre est toujours :
    state → detail
    Ex:
    * duplicate.key
    * missing.file
    * not.found.module

---

### Format

```text
core.<context>.<state>[.detail]
```

---

### Définitions

* **context** : composant ou phase du runtime où se produit l’événement
  (bootstrap, stage, i18n, parser, globals, modules, runtime…)

* **state** : état ou action décrivant ce qui se produit
  (init, ready, missing, not_found, invalid, duplicate…)

* **detail** : précision optionnelle permettant de qualifier plus finement l’événement
  (file, message, keys…)

---

### Exemples

* `core.bootstrap.init`
* `core.bootstrap.ready`
* `core.stage.not.found`
* `core.stage.file.not.found`
* `core.i18n.missing.message`

---

### Les Contextes (CONTEXT)

* **cli** : cœur de la CLI (initialisation globale, instance, etc.)
* **events** : événements internes au `EventsManager` (validation, merge, etc.)
* **bootstrap** : phase d’initialisation du core
* **stages**/**stage** : gestion des stages et gestion de la résolution d'un stage
* **i18n** : gestion des traductions internes
* **parser** : parsing de la CLI (`ParserManager`)
* **globals** : résolution des variables globales
* **modules/module/action** : gestion des modules et actions
* **plugins** : intégration des plugins
* **engine** . orchestration via les engines
* **runtime** : gestion globale du lifecycle via `RuntimeService`
* **unknown** : Cas non reconnu ou non géré par le système

---

### Les États (STATE)

> Si un état est suivi de `_<details>`, alors les détails sont obligatoires.

* **`init`** Début d’une phase ou initialisation d’un composant
* **`already.<details>`** Tentative de réexécution d’un état déjà atteint
* **`ready`** Fin réussie d’une phase ou d’un composant correctement initialisé
* **`hooking`** Exécution de hook d'une phase
* **`fallback.used`** Utilsation d'un fallback pour un composant donné
* **`conflict.<details>`** Élément en conflit avec une autre élément de la config ( ex: ENV STAGE VAR  = ENV GLOBAL VAR )
* **`missing.<details>`** Élément obligatoire absent (déclaration incomplète ou élément introuvable)
* **`unexpected.<details>`** Élément valide mais non attendu dans ce contexte
* **`duplicate.<details>`** Collision dans une structure à clés uniques
* **`invalid.<details>`** État global incohérent ou configuration invalide
* **`unknown.<details>`** Erreur ou objet/configuration impossible à classer (`_<DETAILS>` est optionnel)
* **`reserved.<details>`** Utilisation d’un espace réservé du core
* **`error.<details>`** Erreur non classifiée entraînant une interruption du flow (`_<DETAILS>` est optionnel)
* **`fatal.<details>`** Erreur critique non classifiée entraînant une interruption du flow (`_<DETAILS>` est optionnel)
* **`usage.<details>`** Erreur pendant le parsing qui affiche une aide d'utilisation contextuelle (`_<DETAILS>` est optionnel)

---

### Les Détails (DETAILS)

> Les DETAILS permettent de préciser le contexte exact de l’erreur ou de l’état.
> Ils sont utilisés en combinaison avec les états nécessitant une précision.

* **instance** Utilisé pour les informations autour de l'instance CLI
* **phase** Utilisé pour les erreurs de phase de parsing
* **env** Utilisé pour les ENV VAR dans 'stages' ou 'globals'
* **file** Utilisé pour les ressources fichiers (NOT_FOUND_FILE, MISSING_FILE)
* **prop** Utilisé pour les properties
* **key / keys** Utilisé pour les clés de dictionnaire (DUPLICATE_KEY, MISSING_KEYS)
* **builtin.message** Utilisé pour signaler qu'un message builtin est absent (cela ne doit jamais arriver en v stable)
* **namespace** Utilisé pour les conflits d’espace de nom (RESERVED_NAMESPACE)
* **draft / resolved** Utilisé pour les états internes de résolution des données
* **runner** Utilisé pour la résolution du runner dans le core
* **flag / flag.value / flag.in.scope** Utilisé pour le parsing CLI:
  * flag : flag inconnu ou invalide
  * flag.value : valeur manquante ou incorrecte
  * flag.in.scope : conflit dans un scope donné
* **short.group** Utilisé pour les erreurs liées aux groupes de flags courts
* **module / action** Utilisé pour les states liées aux modules et actions
* **action.hook** Utilisé pour les état liés à l'action
* **transition** Utilisé par le runtime service pour indiquer des erreurs de transition de phase du runtime
* **module.help** Utilisé pour les erreurs liées aux arguments du module builtin help

---

### Notes

* Le naming doit rester **strictement cohérent** dans tout le core
* Aucun synonyme ne doit être introduit (ex : `success` ≠ `ready`)
* Les règles définies ici constituent un **contrat stable** du système

---

## Les noms de clé dans le dictionnaire — Events Keys

Les clés utilisées dans les dictionnaires d’events sont la représentation **interne et programmatique** des events.

Elles doivent être :

* simples à écrire
* cohérentes avec les noms d’events
* sans bruit inutile (pas de préfixe système)

---

### Format

```text
camelCase
```

---

### Règles

* Les clés doivent être écrites en **camelCase**
* Elles ne doivent **pas** contenir de `.`
* Elles ne doivent **pas** contenir le préfixe `core.`
* Elles doivent représenter la même information que le nom de l’event, sans le namespace

---

### Correspondance avec les noms d’events

Chaque clé doit être une **projection directe** du nom d’event associé.

#### Exemple

| Key                | Event Name                |
| ------------------ | ------------------------- |
| bootstrapInit      | core.bootstrap.init       |
| bootstrapReady     | core.bootstrap.ready      |
| stageNotFound      | core.stage.not.found      |
| stageFileNotFound  | core.stage.file.not.found |
| i18nMissingMessage | core.i18n.missing.message |

---

### Structure logique

Les clés suivent la même logique que les noms d’events :

```text
<context><State><Detail?>
```

* **context** : composant ou phase (bootstrap, stage, i18n…)
* **state** : état ou action (init, ready, missing, hooking…)
* **detail** : précision optionnelle (File, Message, Keys…)

---

### Bonnes pratiques

* Utiliser des noms courts mais explicites
* Respecter strictement la correspondance avec les noms d’events
* Éviter toute ambiguïté ou abréviation non standard
* Ne pas introduire de synonymes (ex : `done` au lieu de `ready`)

---

### Objectif

Les clés doivent permettre :

* une utilisation simple côté code (`events.bootstrapInit`)
* une correspondance immédiate avec le système d’events
* une cohérence globale entre code et référentiel

Elles constituent un **alias ergonomique** du nom d’event complet.

---

## CoreError — Référentiel

| key | name | code | source | desc | status |
|-----|------|------|--------|------|--------|
| cliInstanceDuplicate | core.cli.duplicate.instance | F00001 | CLI.init | CLI is already init! | LOCKED |
| eventReservedNamespace | core.event.reserved.namespace | F00100 | Builders.buildEvents | `Event "${key}" cannot use reserved namespace 'CORE.'` | LOCKED |
| eventDuplicateKey | core.event.duplicate.key | F00101 | Builders.buildEvents | `Event key "${key}" already exists` | LOCKED |
| eventDuplicateName | core.event.duplicate.name | F00102 | Builders.buildEvents | `Event name "${name}" already exists` | LOCKED |
| stageDuplicateFile | core.stage.duplicate.file | F00300 | Builders.buildStages | Stage "${stageName}" cannot override builtin "file" | OK |
| stageDuplicateProp | core.stage.duplicate.prop | F00301 | Builders.buildStages | Stage "${stageName}" prop "${propName}" already exists in builtin props | OK |
| stageMissingFile | core.stage.missing.file | F00302 | Builders.buildStages | Custom stage "${stageName}" must declare a "file" | OK |
| stageMissingLang | core.stage.missing.lang | F00303 | Builders.buildStages | Custom stage "${stageName}" must declare a "lang" | OK |
| i18nNameSpace | core.i18n.reserved.namespace | F00400 | Builders.buildTranslations | `Custom translation "${key}" cannot use reserved namespace 'CORE.'` | OK |
| i18nDuplicateMessage | core.i18n.duplicate.message | F00401 | Builders.buildTranslations | Translation key "${key}" already exists in builtin lang "${lang}" | OK |
| i18nInvalidKey | core.i18n.invalid.key | F00402 | Builders.buildTranslations | `Builtin translation "${key}" does not match runtime name "${msg.name}"` | OK |
|                |                       |        |                            |  `Custom translation "${key}" does not match runtime name "${msg.name}"`|    |
| globalsNamespace | core.globals.reserved.namespace | F00600 | Builders.buildGlobals | "core" namespace is reserved and cannot be defined in custom globals | OK |
| modulesNamespace | core.modules.reserved.namespace | F00700 | Builders.buildModules | Module "${key}" is reserved and cannot be overridden | OK |
| unknownError | core.unknown.error | F99999 | unknown | Fallback unknown core error | LOCKED |

* *CoreError (non-locked)*
→ will become Events in a future architecture (no-merge model)

---

## Events - Référentiel

| key | name(old code) | code | level | kind | phase | source | trigger | details/values | status |
|-----|----------------|------|------|-------|-------|--------|---------|----------------|--------|
|bootstrapAlreadyResolved|core.bootstrap.already.resolved|F?????|fatal|signal|bootstrap|BootstrapManager.setResolved|false|none|OK|
|bootstrapMissingResolved|core.bootstrap.missing.resolved|F?????|fatal|signal|bootstrap|BootstrapManager.getResolved|false|none|OK|
|stagesMissingDraft|core.stages.missing.draft|F?????|fatal|signal|stage|StagesManager.getDraft|false|none|OK|
|stagesAlreadyResolved|core.stages.already.resolved|F?????|fatal|signal|stage|StagesManager.setResolved|false|none|OK|
|stagesMissingResolved|core.stages.missing.resolved|F?????|fatal|signal|stage|StagesManager.getResolved|false|none|OK|
|stageDuplicateEnv|core.stage.duplicate.env|F?????|fatal|signal|stage|StagesManager._resolveIndexes|false|details: `[ Env Key: ${envKey}, Stage: ${existing.stageName}, Option: ${existing.optionName}  ]`|OK|
|stageMissing|core.stage.missing|F?????|fatal|signal|stage|StagesManager.resolve|false|details: `[Name: ${stage}]`|OK|
|stageMissingFile|core.stage.missing.file|F?????|fatal|signal|stage|StagesManager.resolve|false|details: `[StageFile: ${file}]`|OK|
|stageMissingLang|core.stage.missing.lang|F?????|fatal|signal|stage|stagesmanager._coreStageHook|false|details: `[Lang: ${lang}]`|OK|
|stageMissingWorkingDir|core.stage.missing.working.dir|F?????|fatal|signal|stage|StagesManager._coreStageHook|false|details: `[Path: ${workingDir}]`|OK|
|stageHooking|core.stage.hooking|T?????|trace|signal|stage|StagesManager.resolve|false|none|OK|
|i18nAlreadyResolved|core.i18n.already.resolved|F?????|fatal|signal|i18n|I18nManager.setResolved|false|none|OK|
|i18nMissingResolved|core.i18n.missing.resolved|F?????|fatal|signal|i18n|I18nManager.getResolved|false|none|OK|
|i18nMissingLang|core.i18n.missing.lang|F?????|fatal|signal|i18n|I18nManager.resolve|false|details: `['en' builtins mandatory]`|OK|
|i18nUnknownKeys|core.i18n.unknown.keys|F?????|fatal|signal|i18n|I18nManager.resolve|false|details: `[lang: unknown.keys]`|OK|
|i18nMissingKeys|core.i18n.missing.keys|W?????|warning|signal|i18n|I18nManager.resolve|false|details: `[lang: missing.keys]`|OK|
|i18nMissingBuiltinMessage|core.i18n.missing.builtin.message|F?????|fatal|signal|i18n|I18nManager.tr|false|details: `[missing.message: keys]`|OK|
|i18nMissingMessageValues|core.i18n.missing.message.values|W?????|warning|signal|i18n|I18nManager.tr|false|details: `[message: values]`|OK|
|i18nFallbackUsed|core.i18n.fallback.used|W?????|warning|signal|i18n|I18nManager.tr|false|none|OK|
|parserMissingDraft|core.parser.missing.draft|F?????|fatal|signal|parser|ParserManager.getDraft|false|none|OK|
|parserMissingResolved|core.parser.missing.resolved|F?????|fatal|signal|parser|ParserManager.getResolved|false|none|OK|
|parserInvalidPhase|core.parser.invalid.phase|F?????|fatal|message|parser|resolveGlobals/resolveModule/finalizeArgsPhase/finalize|false|values: { currentPhase: string, neededPhase: string, method: string }|OK|
|globalsMissingDraft|core.globals.missing.draft|F?????|fatal|signal|globals|GlobalsManager.getDraft|false|none|OK|
|globalsAlreadyResolved|core.globals.already.resolved|F?????|fatal|signal|globals|GlobalsManager.setResolved|false|none|OK|
|globalsMissingResolved|core.globals.missing.resolved|F?????|fatal|signal|globals|GlobalsManager.getResolved|false|none|OK|
|globalsDuplicateEnv|core.globals.duplicate.env|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[opt.env]`|OK|
|globalsConflictEnv|core.globals.conflict.env|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[ ${env}, stage: ${runtimeStage} ]` |OK|
|globalsDuplicateFlag|core.globals.duplicate.flag|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[${flag}]`|OK|
|globalsHooking|core.globals.hooking|T?????|trace|message|globals|GlobalsManager.resolve|false|none|OK|
|modulesMissingDraft|core.modules.missing.draft|F?????|fatal|signal|modules|ModulesManager.getDraft|false|none|OK|
|moduleDuplicateFlag|core.module.duplicate.flag|F?????|fatal|signal|modules|ModulessManager._resolveIndexes|false|details: `["module: ${module}", "flag: ${flag}"]`|OK|
|actionDuplicateFlag|core.action.duplicate.flag|F?????|fatal|signal|modules|ModulessManager._resolveIndexes|false|details: `["module: ${module}", "action: ${action}", "flag: ${flag}"]`|OK|
|modulesAlreadyResolved|core.modules.already.resolved|F?????|fatal|signal|modules|ModulesManager.setResolved|false|none|OK|
|modulesMissingResolved|core.modules.missing.resolved|F?????|fatal|signal|modules|ModulesManager.getResolved|false|none|OK|
|modulesConflictModule|core.modules.conflict.module|F?????|fatal|signal|modules|ModulesManager._resolveIndexes|false|none|OK|
|modulesConflictAction|core.modules.conflict.action|F?????|fatal|signal|modules|ModulesManager._resolveIndexes|false|none|OK|
|modulesHooking|core.modules.hooking|T?????|trace|message|modules|ModulesManager.resolve|false|none|OK|
|modulesMissingActionHook|core.modules.missing.action.hook|F?????|fatal|message|modules|ModulesManager.runner|false|values: { module:string, action:string }|OK|
|runtimeMissingDraft|core.runtime.missing.draft|F?????|fatal|signal|runtime|RuntimeService.getDraft|false|none|OK|
|runtimeAlreadyResolved|core.runtime.already.resolved|F?????|fatal|signal|runtime|RuntimeService.setResolved|false|none|OK|
|runtimeMissingResolved|core.runtime.missing.resolved|F?????|fatal|signal|runtime|RuntimeService.getResolved|false|none|OK|
|runtimeInvalidTransition|core.runtime.invalid.transition|F?????|fatal|signal|runtime|RuntimeService._setState|false|none|OK|
|runtimeInit|core.runtime.init|T?????|trace|signal|runtime|RuntimeService.setInit|true|none|OK|
|bootstrapInit|core.bootstrap.init|T?????|trace|signal|bootstrap|RuntimeService.setBootstrap|false|none|OK|
|bootstrapReady|core.bootstrap.ready|T?????|trace|signal|bootstrap|RuntimeService.setBootstrap|true|none|OK|
|stageInit|core.stage.init|T?????|trace|signal|stage|RuntimeService.setStage|false|none|OK|
|i18nInit|core.i18n.init|T?????|trace|signal|i18n|RuntimeService.setStage|false|none|OK|
|i18nReady|core.i18n.ready|T?????|trace|signal|i18n|RuntimeService.setStage|false|none|OK|
|parserInit|core.parser.init|T?????|trace|message|parser|RuntimeService.setStage|false|none|OK|
|parserReady|core.parser.ready|T?????|trace|message|parser|RuntimeService.setReady|false|none|OK|
|stageReady|core.stage.ready|T?????|trace|message|stage|RuntimeService.setStage|true|none|OK|
|globalsInit|core.globals.init|T?????|trace|message|globals|RuntimeService.setGlobals|false|none|OK|
|globalsReady|core.globals.ready|T?????|trace|message|globals|RuntimeService.setGlobals|true|none|OK|
|modulesInit|core.modules.init|T?????|trace|message|modules|RuntimeService.setModules|false|none|OK|
|modulesReady|core.modules.ready|T?????|trace|message|modules|RuntimeService.setModules|true|none|OK|
|runtimeReady|core.runtime.ready|T?????|trace|message|runtime|RuntimeService.setReady|true|none|OK|
|runtimeMissingEvent|core.runtime.missing.event|E?????|error|signal|runtime|EventsManager._emit|false|details: `["code"]`|OK|
|engineUnknown|core.engine.unknown|F?????|fatal|signal|runtime|CoreEngine.getEngine|false|none|OK|
|engineUnknownRunner|core.engine.unknown.runner|F?????|fatal|signal|runtime|CoreEngine.getRunner|false|none|OK|
|parserUnknownGlobalFlag|core.parser.unknown.global.flag|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserUnknownModuleFlag|core.parser.unknown.module.flag|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserUnknownActionFlag|core.parser.unknown.action.flag|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserMissingFlagValue|core.parser.missing.flag.value|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserUnexpectedFlagValue|core.parser.unexpected.flag.value|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserInvalidShortGroup|core.parser.invalid.short.group|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string }|OK|
|parserDuplicatedFlag|core.parser.duplicate.flag|W?????|warning|message|parser|ParserHelpers|false|values: { flag: string, opt: string, scope: string }|OK|
|parserMissingModule|core.parser.missing.module|W?????|warning|message|parser|ParserHelpers|false|none|OK|
|parserMissingAction|core.parser.missing.action|W?????|warning|message|parser|ParserHelpers|false| values: { module: string }|OK|
|parserUnknownModule|core.parser.unknown.module|W?????|warning|message|parser|ParserHelpers|false|values: { module: string }|OK|
|parserUnknownAction|core.parser.unknown.action|W?????|warning|message|parser|ParserHelpers|false|values: { module: string, action: string }|OK|
|parserUsage|core.parser.usage|E?????|error|message|parser|ModulesManager.runner|false| values: { helpCli: string } |OK|
|parserUsageModule|core.parser.usage.module|E?????|error|message|parser|ModulesManager.runner|false|values: { helpCli: string, module: string }|OK|
|parserUsageAction|core.parser.usage.action|E?????|error|message|parser|ModulesManager.runner|false|values: { helpCli: string, module: string, action: string }|OK|
|parserUsageGlobalFlag|core.parser.usage.global.flag|E?????|error|message|parser|ModulesManager.runner|false|values: { helpCli: string, flag: string }|OK|
|parserUsageModuleFlag|core.parser.usage.module.flag|E?????|error|message|parser|ModulesManager.runner|false|values: { helpCli: string, flag: string, module: string }|OK|
|parserUsageActionFlag|core.parser.usage.action.flag|E?????|error|message|parser|ModulesManager.runner|false|values: { helpCli: string, flag: string, module: string, action: string }|OK|

---
