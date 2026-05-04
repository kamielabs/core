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

* Tous les events (y compris les CoreError) doivent commencer par `CORE_`
* Le namespace `^CORE_.*$` est réservé exclusivement au core
* Chaque event doit suivre un pattern déterministe et cohérent
* Le naming suit une logique formelle et non linguistique.
  * L’ordre est toujours :
    STATE → DETAIL
    Ex:
    * DUPLICATE_KEY
    * MISSING_FILE
    * NOT_FOUND_MODULE

---

### Format

```text
CORE_<CONTEXT>_<STATE>[_DETAIL]
```

---

### Définitions

* **CONTEXT** : composant ou phase du runtime où se produit l’événement
  (BOOTSTRAP, STAGE, I18N, PARSER, GLOBALS, MODULES, RUNTIME…)

* **STATE** : état ou action décrivant ce qui se produit
  (INIT, READY, MISSING, NOT_FOUND, INVALID, DUPLICATE…)

* **DETAIL** : précision optionnelle permettant de qualifier plus finement l’événement
  (FILE, MESSAGE, KEYS…)

---

### Exemples

* `CORE_BOOTSTRAP_INIT`
* `CORE_BOOTSTRAP_READY`
* `CORE_STAGE_NOT_FOUND`
* `CORE_STAGE_FILE_NOT_FOUND`
* `CORE_I18N_MISSING_MESSAGE`

---

### Les Contextes (CONTEXT)

* **CLI** : cœur de la CLI (initialisation globale, instance, etc.)
* **EVENTS** : événements internes au `EventsManager` (validation, merge, etc.)
* **BOOTSTRAP** : phase d’initialisation du core
* **STAGES**/**STAGE** : gestion des stages et gestion de la résolution d'un stage
* **I18N** : gestion des traductions internes
* **PARSER** : parsing de la CLI (`ParserManager`)
* **GLOBALS** : résolution des variables globales
* **MODULES** : gestion des modules et actions
* **PLUGINS** : intégration des plugins
* **ENGINE** : orchestration via les engines
* **RUNTIME** : gestion globale du lifecycle via `RuntimeService`
* **UNKNOWN** : Cas non reconnu ou non géré par le système

---

### Les États (STATE)

> Si un état est suivi de `_<DETAILS>`, alors les détails sont obligatoires.

* **`INIT`** Début d’une phase ou initialisation d’un composant
* **`ALREADY_<DETAILS>`** Tentative de réexécution d’un état déjà atteint
* **`READY`** Fin réussie d’une phase ou d’un composant correctement initialisé
* **`HOOKING`** Exécution de hook d'une phase
* **`FALLBACK_USED`** Utilsation d'un fallback pour un composant donné
* **`CONFLICT_<DETAILS>`** Élément en conflit avec une autre élément de la config ( ex: ENV STAGE VAR  = ENV GLOBAL VAR )
* **`MISSING_<DETAILS>`** Élément obligatoire absent (déclaration incomplète ou élément introuvable)
* **`UNEXPECTED_<DETAILS>`** Élément valide mais non attendu dans ce contexte
* **`DUPLICATE_<DETAILS>`** Collision dans une structure à clés uniques
* **`INVALID_<DETAILS>`** État global incohérent ou configuration invalide
* **`UNKNOWN_<DETAILS>`** Erreur ou objet/configuration impossible à classer (`_<DETAILS>` est optionnel)
* **`RESERVED_<DETAILS>`** Utilisation d’un espace réservé du core
* **`ERROR_<DETAILS>`** Erreur non classifiée entraînant une interruption du flow (`_<DETAILS>` est optionnel)
* **`FATAL_<DETAILS>`** Erreur critique non classifiée entraînant une interruption du flow (`_<DETAILS>` est optionnel)

---

### Les Détails (DETAILS)

> Les DETAILS permettent de préciser le contexte exact de l’erreur ou de l’état.
> Ils sont utilisés en combinaison avec les états nécessitant une précision.

* **INSTANCE** Utilisé pour les informations autour de l'instance CLI
* **PHASE** Utilisé pour les erreurs de phase de parsing
* **ENV** Utilisé pour les ENV VAR dans 'stages' ou 'globals'
* **FILE** Utilisé pour les ressources fichiers (NOT_FOUND_FILE, MISSING_FILE)
* **PROP** Utilisé pour les properties
* **KEY / KEYS** Utilisé pour les clés de dictionnaire (DUPLICATE_KEY, MISSING_KEYS)
* **MESSAGE** Utilisé pour les messages i18n ou erreurs utilisateur
* **NAMESPACE** Utilisé pour les conflits d’espace de nom (RESERVED_NAMESPACE)
* **DRAFT / RESOLVED** Utilisé pour les états internes de résolution des données
* **RUNNER** Utilisé pour la résolution du runner dans le core
* **FLAG / FLAG_VALUE / FLAG_IN_SCOPE** Utilisé pour le parsing CLI :
  * FLAG : flag inconnu ou invalide
  * FLAG_VALUE : valeur manquante ou incorrecte
  * FLAG_IN_SCOPE : conflit dans un scope donné
* **SHORT_GROUP** Utilisé pour les erreurs liées aux groupes de flags courts
* **MODULE / ACTION** Utilisé pour les erreurs liées aux modules et actions
* **ACTION_HOOK** Utilisé pour les état liés à l'action
* **TRANSITION** Utilisé par le runtime service pour indiquer des erreurs de transition de phase du runtime

---

### Notes

* Le naming doit rester **strictement cohérent** dans tout le core
* Aucun synonyme ne doit être introduit (ex : `SUCCESS` ≠ `READY`)
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
* Elles ne doivent **pas** contenir de `_`
* Elles ne doivent **pas** contenir le préfixe `CORE_`
* Elles doivent représenter la même information que le nom de l’event, sans le namespace

---

### Correspondance avec les noms d’events

Chaque clé doit être une **projection directe** du nom d’event associé.

#### Exemple

| Key                | Event Name                |
| ------------------ | ------------------------- |
| bootstrapInit      | CORE_BOOTSTRAP_INIT       |
| bootstrapReady     | CORE_BOOTSTRAP_READY      |
| stageNotFound      | CORE_STAGE_NOT_FOUND      |
| stageFileNotFound  | CORE_STAGE_FILE_NOT_FOUND |
| i18nMissingMessage | CORE_I18N_MISSING_MESSAGE |

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
| cliInstanceDuplicate | CORE_CLI_DUPLICATE_INSTANCE | F00001 | CLI.init | CLI is already init! | LOCKED |
| eventReservedNamespace | CORE_EVENT_RESERVED_NAMESPACE | F00100 | Builders.buildEvents | `Event "${key}" cannot use reserved namespace 'CORE_'` | LOCKED |
| eventDuplicateKey | CORE_EVENT_DUPLICATE_KEY | F00101 | Builders.buildEvents | `Event key "${key}" already exists` | LOCKED |
| eventDuplicateName | CORE_EVENT_DUPLICATE_NAME | F00102 | Builders.buildEvents | `Event name "${name}" already exists` | LOCKED |
| stageDuplicateFile | CORE_STAGE_DUPLICATE_FILE | F00300 | Builders.buildStages | Stage "${stageName}" cannot override builtin "file" | OK |
| stageDuplicateProp | CORE_STAGE_DUPLICATE_PROP | F00301 | Builders.buildStages | Stage "${stageName}" prop "${propName}" already exists in builtin props | OK |
| stageMissingFile | CORE_STAGE_MISSING_FILE | F00302 | Builders.buildStages | Custom stage "${stageName}" must declare a "file" | OK |
| stageMissingLang | CORE_STAGE_MISSING_LANG | F00303 | Builders.buildStages | Custom stage "${stageName}" must declare a "lang" | OK |
| i18nDuplicateMessage | CORE_I18N_DUPLICATE_MESSAGE | F00400 | Builders.buildTranslations | Translation key "${key}" already exists in builtin lang "${lang}" | OK |
| globalsNamespace | CORE_GLOBALS_RESERVED_NAMESPACE | F00600 | Builders.buildGlobals | "core" namespace is reserved and cannot be defined in custom globals | OK |
| modulesNamespace | CORE_MODULES_RESERVED_NAMESPACE | F00700 | Builders.buildModules | Module "${key}" is reserved and cannot be overridden | OK |
| unknownError | CORE_UNKNOWN_ERROR | F99999 | unknown | Fallback unknown core error | LOCKED |

* *CoreError (non-locked)*
→ will become Events in a future architecture (no-merge model)

---

## Events - Référentiel

| key | name(old code) | code | level | kind | phase | source | trigger | details/values | status |
|-----|----------------|------|------|-------|-------|--------|---------|----------------|--------|
|bootstrapAlreadyResolved|CORE_BOOTSTRAP_ALREADY_RESOLVED|F?????|fatal|signal|bootstrap|BootstrapManager.setResolved|false|none|OK|
|bootstrapMissingResolved|CORE_BOOTSTRAP_MISSING_RESOLVED|F?????|fatal|signal|bootstrap|BootstrapManager.getResolved|false|none|OK|
|stagesMissingDraft|CORE_STAGES_MISSING_DRAFT|F?????|fatal|signal|stage|StagesManager.getDraft|false|none|OK|
|stagesAlreadyResolved|CORE_STAGES_ALREADY_RESOLVED|F?????|fatal|signal|stage|StagesManager.setResolved|false|none|OK|
|stagesMissingResolved|CORE_STAGES_MISSING_RESOLVED|F?????|fatal|signal|stage|StagesManager.getResolved|false|none|OK|
|stageDuplicateEnv|CORE_STAGE_DUPLICATE_ENV|F?????|fatal|signal|stage|StagesManager._resolveIndexes|false|details: `[ Env Key: ${envKey}, Stage: ${existing.stageName}, Option: ${existing.optionName}  ]`|OK|
|stageMissing|CORE_STAGE_MISSING|F?????|fatal|signal|stage|StagesManager.resolve|false|details: `[Name: ${stage}]`|OK|
|stageMissingFile|CORE_STAGE_MISSING_FILE|F?????|fatal|signal|stage|StagesManager.resolve|false|details: `[StageFile: ${file}]`|OK|
|stageMissingLang|CORE_STAGE_MISSING_LANG|F?????|fatal|signal|stage|StagesManager._coreStageHook|false|details: `[Lang: ${lang}]`|OK|
|stageMissingWorkingDir|CORE_STAGE_MISSING_WORKING_DIR|F?????|fatal|signal|stage|StagesManager._coreStageHook|false|details: `[Path: ${workingDir}]`|OK|
|stageHooking|CORE_STAGE_HOOKING|T?????|trace|signal|stage|StagesManager.resolve|false|none|OK|
|i18nAlreadyResolved|CORE_I18N_ALREADY_RESOLVED|F?????|fatal|signal|i18n|I18nManager.setResolved|false|none|OK|
|i18nMissingResolved|CORE_I18N_MISSING_RESOLVED|F?????|fatal|signal|i18n|I18nManager.getResolved|false|none|OK|
|i18nMissingLang|CORE_I18N_MISSING_LANG|F?????|fatal|signal|i18n|I18nManager.resolve|false|details: `['en' builtins mandatory]`|OK|
|i18nUnknownKeys|CORE_I18N_UNKNOWN_KEYS|F?????|fatal|signal|i18n|I18nManager.resolve|false|details: `[lang: unknown_keys]`|OK|
|i18nMissingKeys|CORE_I18N_MISSING_KEYS|W?????|warning|signal|i18n|I18nManager.resolve|false|details: `[lang: missing_keys]`|OK|
|i18nMissingMessage|CORE_I18N_MISSING_MESSAGE|W?????|warning|signal|i18n|I18nManager.tr|false|details: `[missing_message: keys]`|OK|
|i18nMissingMessageValues|CORE_I18N_MISSING_MESSAGE_VALUES|W?????|warning|signal|i18n|I18nManager.tr|false|details: `[message: values]`|OK|
|i18nFallbackUsed|CORE_I18N_FALLBACK_USED|W?????|warning|signal|i18n|I18nManager.tr|false|none|OK|
|parserMissingDraft|CORE_PARSER_MISSING_DRAFT|F?????|fatal|signal|parser|ParserManager.getDraft|false|none|OK|
|parserMissingResolved|CORE_PARSER_MISSING_RESOLVED|F?????|fatal|signal|parser|ParserManager.getResolved|false|none|OK|
|parserInvalidPhase|CORE_PARSER_INVALID_PHASE|F?????|fatal|message|parser|resolveGlobals/resolveModule/finalizeArgsPhase/finalize|false|values: { currentPhase: string, neededPhase: string, method: string }|OK|
|globalsMissingDraft|CORE_GLOBALS_MISSING_DRAFT|F?????|fatal|signal|globals|GlobalsManager.getDraft|false|none|OK|
|globalsAlreadyResolved|CORE_GLOBALS_ALREADY_RESOLVED|F?????|fatal|signal|globals|GlobalsManager.setResolved|false|none|OK|
|globalsMissingResolved|CORE_GLOBALS_MISSING_RESOLVED|F?????|fatal|signal|globals|GlobalsManager.getResolved|false|none|OK|
|globalsDuplicateEnv|CORE_GLOBALS_DUPLICATE_ENV|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[opt.env]`|OK|
|globalsConflictEnv|CORE_GLOBALS_CONFLICT_ENV|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[ ${env}, stage: ${runtimeStage} ]` |OK|
|globalsDuplicateFlag|CORE_GLOBALS_DUPLICATE_FLAG|F?????|fatal|signal|globals|GlobalsManager._resolveIndexes|false|details: `[${flag}]`|OK|
|globalsHooking|CORE_GLOBALS_HOOKING|T?????|trace|message|globals|GlobalsManager.resolve|false|none|OK|
|modulesMissingDraft|CORE_MODULES_MISSING_DRAFT|F?????|fatal|signal|modules|ModulesManager.getDraft|false|none|OK|
|modulesAlreadyResolved|CORE_MODULES_ALREADY_RESOLVED|F?????|fatal|signal|modules|ModulesManager.setResolved|false|none|OK|
|modulesMissingResolved|CORE_MODULES_MISSING_RESOLVED|F?????|fatal|signal|modules|ModulesManager.getResolved|false|none|OK|
|modulesConflictModule|CORE_MODULES_CONFLICT_MODULE|F?????|fatal|signal|modules|ModulesManager._resolveIndexes|false|none|OK|
|modulesConflictAction|CORE_MODULES_CONFLICT_ACTION|F?????|fatal|signal|modules|ModulesManager._resolveIndexes|false|none|OK|
|modulesHooking|CORE_MODULES_HOOKING|T?????|trace|message|modules|ModulesManager.resolve|false|none|OK|
|modulesMissingActionHook|CORE_MODULES_MISSING_ACTION_HOOK|F?????|fatal|message|modules|ModulesManager.runner|false|values: { module:string, action:string }|OK|
|runtimeMissingDraft|CORE_RUNTIME_MISSING_DRAFT|F?????|fatal|signal|runtime|RuntimeService.getDraft|false|none|OK|
|runtimeAlreadyResolved|CORE_RUNTIME_ALREADY_RESOLVED|F?????|fatal|signal|runtime|RuntimeService.setResolved|false|none|OK|
|runtimeMissingResolved|CORE_RUNTIME_MISSING_RESOLVED|F?????|fatal|signal|runtime|RuntimeService.getResolved|false|none|OK|
|runtimeInvalidTransition|CORE_RUNTIME_INVALID_TRANSITION|F?????|fatal|signal|runtime|RuntimeService._setState|false|none|OK|
|runtimeInit|CORE_RUNTIME_INIT|T?????|trace|signal|runtime|RuntimeService.setInit|true|none|OK|
|bootstrapInit|CORE_BOOTSTRAP_INIT|T?????|trace|signal|bootstrap|RuntimeService.setBootstrap|false|none|OK|
|bootstrapReady|CORE_BOOTSTRAP_READY|T?????|trace|signal|bootstrap|RuntimeService.setBootstrap|true|none|OK|
|stageInit|CORE_STAGE_INIT|T?????|trace|signal|stage|RuntimeService.setStage|false|none|OK|
|i18nInit|CORE_I18N_INIT|T?????|trace|signal|i18n|RuntimeService.setStage|false|none|OK|
|i18nReady|CORE_I18N_READY|T?????|trace|signal|i18n|RuntimeService.setStage|false|none|OK|
|parserInit|CORE_PARSER_INIT|T?????|trace|message|parser|RuntimeService.setStage|false|none|OK|
|parserReady|CORE_PARSER_READY|T?????|trace|message|parser|RuntimeService.setReady|false|none|OK|
|stageReady|CORE_STAGE_READY|T?????|trace|message|stage|RuntimeService.setStage|true|none|OK|
|globalsInit|CORE_GLOBALS_INIT|T?????|trace|message|globals|RuntimeService.setGlobals|false|none|OK|
|globalsReady|CORE_GLOBALS_READY|T?????|trace|message|globals|RuntimeService.setGlobals|true|none|OK|
|modulesInit|CORE_MODULES_INIT|T?????|trace|message|modules|RuntimeService.setModules|false|none|OK|
|modulesReady|CORE_MODULES_READY|T?????|trace|message|modules|RuntimeService.setModules|true|none|OK|
|runtimeReady|CORE_RUNTIME_READY|T?????|trace|message|runtime|RuntimeService.setReady|true|none|OK|
|runtimeMissingEvent|CORE_RUNTIME_MISSING_EVENT|E?????|error|signal|runtime|EventsManager._emit|false|details: `["code"]`|OK|
|engineUnknown|CORE_ENGINE_UNKNOWN|F?????|fatal|signal|runtime|CoreEngine.getEngine|false|none|OK|
|engineUnknownRunner|CORE_ENGINE_UNKNOWN_RUNNER|F?????|fatal|signal|runtime|CoreEngine.getRunner|false|none|OK|

---

## tous les détails et informations des Events

* **`Les Parser Warnings seront rework dans un second temps`**

* ts/lib/helpers/ParsingHelpers.ts:

  * **les erreurs de parsing actuelles utilisent un système interne qui stocke les erreurs dans un dict renvoyé au runner**

  * nous listons tous les parsing issues ici pour future update vers eventMessage ->

  ```ts
  export interface ParserIssue {
   code:
   | "UNKNOWN_FLAG"
   | "MISSING_FLAG_VALUE"
   | "UNEXPECTED_FLAG_VALUE"
   | "DUPLICATE_FLAG_IN_SCOPE"
   | "INVALID_SHORT_GROUP"
   | "MODULE_MISSING"
   | "ACTION_MISSING";
   message: string;
   token?: string;
  }
  ```

|nom|source|desc|token|status|type|
|---|---|---|---|---|---|
|UNKNOWN_FLAG|parseLongFlagToken|`Unknown flag "${rawKey}" in current scope`|true|KO: ParserIssue to convert|message|
|MISSING_FLAG_VALUE|parseLongFlagToken|`Flag "${rawKey}" requires a value`|true|KO: ParserIssue to convert|message|
|UNEXPECTED_FLAG_VALUE|parseLongFlagToken|`Flag "${rawKey}" does not accept a user value`|true|KO: ParserIssue to convert|message|
|UNKNOWN_FLAG|parseShortFlagToken|`Invalid short flag token "${token}"`|true|KO: ParserIssue to convert|message|
|UNKNOWN_FLAG|parseShortFlagToken|`Unknown flag "${rawKey}" in current scope`|true|KO: ParserIssue to convert|message|
|UNEXPECTED_FLAG_VALUE|parseShortFlagToken|`Flag "${rawKey}" does not accept a user value`|true|KO: ParserIssue to convert|message|
|UNKNOWN_FLAG|parseShortFlagToken|`Unknown flag "${rawKey}" in current scope`|true|KO: ParserIssue to convert|message|
|MISSING_FLAG_VALUE|parseShortFlagToken|`Flag "${rawKey}" requires a value`|true|KO: ParserIssue to convert|message|
|UNKNOWN_FLAG|parseShortFlagToken|`Unknown flag "${rawKey}" in current scope`|true|KO: ParserIssue to convert|message|
|INVALID_SHORT_GROUP|parseShortFlagToken|`Flag "${rawKey}" requires a value and cannot appear before the end of a short group`|true|KO: ParserIssue to convert|message|
|MISSING_FLAG_VALUE|parseShortFlagToken|`Flag "${rawKey}" requires a value`|true|KO: ParserIssue to convert|message|
|UNEXPECTED_FLAG_VALUE|parseShortFlagToken|`Flag "${rawKey}" does not accept a user value`|true|KO: ParserIssue to convert|message|
|DUPLICATE_FLAG_IN_SCOPE|applyFlag|`Duplicate flag for option "${optionName}" in current scope`|true|KO: ParserIssue to convert|message|
|MODULE_MISSING_NOTOKEN|parseKeywordPhase|"Module is missing" |false|KO: ParserIssue to convert|message|
|ACTION_MISSING_NOTOKEN|parseKeywordPhase|"Action is missing" |false|KO: ParserIssue to convert|message|
|MODULE_MISSING|parseKeywordPhase|"Module is missing" |true|KO: ParserIssue to convert|message|
|ACTION_MISSING|parseKeywordPhase|"Action is missing" |true|KO: ParserIssue to convert|message|
|UNKNOWN_MODULE|parseKeywordPhase|"Unknown module" |true|KO: ParserIssue to convert|message|
|UNKNOWN_ACTION|parseKeywordPhase|"Unknown action" |true|KO: ParserIssue to convert|message|

une parserIssue est build de cette manière aujourd'hui  :

```ts
 public static buildIssue(
  code: ParserIssue["code"],
  message: string,
  token?: string
 ): ParserIssue {
  if (token) return { code, message, token }
  else return { code, message };
 };

```

les issues sont stockées dans le ParserManager sous cette forme :

```ts
private result: ParsedCliContextResult = {
  context: {},
  ignored: [],
  issues: []
 };
```

---
