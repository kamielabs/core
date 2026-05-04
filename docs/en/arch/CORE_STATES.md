# List of core states

## ⚠️ Reference status

This document defines the naming and structuring system for core events.

⚠️ IMPORTANT:

* Codes (`X00000`) are **not yet definitively assigned**
* The defined ranges are **provisional**
* Event ↔ code associations are **subject to change**

👉 Full stabilization will be performed in:

* RFC-0001 (code and CoreError normalization)

CoreError entries not marked as `LOCKED` are considered transitional.

They will be:

* either removed
* or converted into `fatal` events

👉 This migration will be handled in:

* RFC-0001 (code and CoreError normalization)

This document must be considered as:
→ a **structuring working base**
→ and not a final fixed contract

## Event types (kind)

### signal

* Internal core event
* Does not support i18n

---

### message

* Internal core event
* Supports i18n
* Can contain dynamic values for interpolation

---

## Trigger (flow control)

Each event can define a `trigger` flag.

* `trigger: true` → the event can be used by an engine in FED mode (Full Event Driven) to drive the runtime execution flow
* `trigger: false` → the event is not used for flow control

---

### Fundamental rule

Flow control does NOT depend on:

* `kind` (signal/message)
* `level` (trace → fatal)

Flow control depends ONLY on:

* `trigger`

---

### Execution rule

An event with `trigger: true` must be explicitly handled by the engine.

Otherwise, it has no effect on the execution flow.

---

### ⚠️ IMPORTANT

A `message` type event can also drive the flow if `trigger: true`.

It must not be considered only as a display event.

---

## Terminal Events (level)

`error` and `fatal` level events are **TerminalEventsLevel**.

### Behavior

* They **immediately** terminate the full execution of the script
* This behavior is **independent** of:

  * `trigger`
  * engine mode (std or fed)
  * execution context (sync or async)

---

### Execution rule

* A TerminalEvent is **always executed at the end of the flow** if the process is still active
* It interrupts the runtime as soon as it is emitted
* No following event must be processed

---

### Objective

Guarantee:

* deterministic runtime termination
* overall consistency of the execution system
* absence of inconsistent states after a critical error

---

## 🔒 CoreError policy

* **CoreError** entries are strictly limited to the **pre-events** phase (bootstrap / builders)
* This list is considered **closed** after `EventsManager` initialization

---

## ParserIssue policy

ParserIssue entries are not blocking at parse time.

They are accumulated and then interpreted by the runner.

Eventually, ParserIssue entries will be removed as an internal system.

They will be replaced by `message` type events
in a unified architecture.

👉 This transformation is planned in:

* RFC-0004 (Parser → Events refactor)

---

## ⚙️ After EventsManager initialization

* All anomalies MUST go through the **event system**
* Fatal conditions MUST:

  * emit a **fatal event**
  * interrupt the execution flow
* No new **CoreError** must be introduced

---

## 🚨 Evolution rule

If introducing a new CoreError seems necessary:

→ it is a **design problem**

→ the resolution MUST go through an **RFC**

---

## Events Codes - Reference

* `X` corresponds to one of these letters: `T`, `D`, `I`, `W`, `E`, `F`
* the code is unique even though the letter may be different between two codes:
  * `T00001` and `F00001` <- forbidden.
  * `T00001` and `F00002` <- allowed
* it is the 5-digit number that must be unique and not the full code.

⚠️ This rule will be strictly applied during the final implementation (RFC-0001)

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

## Event Names — Rules

* All events (including CoreError entries) must begin with `CORE_`
* The `^CORE_.*$` namespace is reserved exclusively for the core
* Each event must follow a deterministic and coherent pattern
* Naming follows a formal logic and not a linguistic one.
  * The order is always:
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

### Definitions

* **CONTEXT** : component or runtime phase where the event occurs
  (BOOTSTRAP, STAGE, I18N, PARSER, GLOBALS, MODULES, RUNTIME…)

* **STATE** : state or action describing what happens
  (INIT, READY, MISSING, NOT_FOUND, INVALID, DUPLICATE…)

* **DETAIL** : optional precision to qualify the event more precisely
  (FILE, MESSAGE, KEYS…)

---

### Examples

* `CORE_BOOTSTRAP_INIT`
* `CORE_BOOTSTRAP_READY`
* `CORE_STAGE_NOT_FOUND`
* `CORE_STAGE_FILE_NOT_FOUND`
* `CORE_I18N_MISSING_MESSAGE`

---

### Contexts (CONTEXT)

* **CLI** : CLI core (global initialization, instance, etc.)
* **EVENTS** : internal `EventsManager` events (validation, merge, etc.)
* **BOOTSTRAP** : core initialization phase
* **STAGES**/**STAGE** : stages management and stage resolution management
* **I18N** : internal translations management
* **PARSER** : CLI parsing (`ParserManager`)
* **GLOBALS** : global variables resolution
* **MODULES** : modules and actions management
* **PLUGINS** : plugins integration
* **ENGINE** : orchestration through engines
* **RUNTIME** : global lifecycle management through `RuntimeService`
* **UNKNOWN** : Unrecognized or unhandled case by the system

---

### States (STATE)

> If a state is followed by `_<DETAILS>`, then details are mandatory.

* **`INIT`** Start of a phase or initialization of a component
* **`ALREADY_<DETAILS>`** Attempt to re-execute a state already reached
* **`READY`** Successful end of a phase or correctly initialized component
* **`HOOKING`** Execution of a phase hook
* **`FALLBACK_USED`** Use of a fallback for a given component
* **`CONFLICT_<DETAILS>`** Element in conflict with another config element ( ex: ENV STAGE VAR = ENV GLOBAL VAR )
* **`MISSING_<DETAILS>`** Mandatory missing element (incomplete declaration or missing element)
* **`UNEXPECTED_<DETAILS>`** Valid element but not expected in this context
* **`DUPLICATE_<DETAILS>`** Collision in a unique-key structure
* **`INVALID_<DETAILS>`** Inconsistent global state or invalid configuration
* **`UNKNOWN_<DETAILS>`** Error or object/configuration impossible to classify (`_<DETAILS>` is optional)
* **`RESERVED_<DETAILS>`** Use of a core reserved space
* **`ERROR_<DETAILS>`** Unclassified error causing a flow interruption (`_<DETAILS>` is optional)
* **`FATAL_<DETAILS>`** Critical unclassified error causing a flow interruption (`_<DETAILS>` is optional)

---

### Details (DETAILS)

> DETAILS make it possible to specify the exact context of the error or state.
> They are used in combination with states requiring precision.

* **INSTANCE** Used for information around the CLI instance
* **PHASE** Used for parsing phase errors
* **ENV** Used for ENV VAR in 'stages' or 'globals'
* **FILE** Used for file resources (NOT_FOUND_FILE, MISSING_FILE)
* **PROP** Used for properties
* **KEY / KEYS** Used for dictionary keys (DUPLICATE_KEY, MISSING_KEYS)
* **MESSAGE** Used for i18n messages or user errors
* **NAMESPACE** Used for namespace conflicts (RESERVED_NAMESPACE)
* **DRAFT / RESOLVED** Used for internal data resolution states
* **RUNNER** Used for runner resolution in the core
* **FLAG / FLAG_VALUE / FLAG_IN_SCOPE** Used for CLI parsing:
  * FLAG : unknown or invalid flag
  * FLAG_VALUE : missing or incorrect value
  * FLAG_IN_SCOPE : conflict in a given scope
* **SHORT_GROUP** Used for errors related to short flag groups
* **MODULE / ACTION** Used for errors related to modules and actions
* **ACTION_HOOK** Used for states related to the action
* **TRANSITION** Used by the runtime service to indicate runtime phase transition errors

---

### Notes

* Naming must remain **strictly coherent** throughout the core
* No synonym must be introduced (ex: `SUCCESS` ≠ `READY`)
* The rules defined here constitute a **stable contract** of the system

---

## Key names in the dictionary — Event Keys

The keys used in event dictionaries are the **internal and programmatic** representation of events.

They must be:

* easy to write
* coherent with event names
* without unnecessary noise (no system prefix)

---

### Format

```text
camelCase
```

---

### Rules

* Keys must be written in **camelCase**
* They must **not** contain `_`
* They must **not** contain the `CORE_` prefix
* They must represent the same information as the event name, without the namespace

---

### Mapping with event names

Each key must be a **direct projection** of the associated event name.

#### Example

| Key                | Event Name                |
| ------------------ | ------------------------- |
| bootstrapInit      | CORE_BOOTSTRAP_INIT       |
| bootstrapReady     | CORE_BOOTSTRAP_READY      |
| stageNotFound      | CORE_STAGE_NOT_FOUND      |
| stageFileNotFound  | CORE_STAGE_FILE_NOT_FOUND |
| i18nMissingMessage | CORE_I18N_MISSING_MESSAGE |

---

### Logical structure

Keys follow the same logic as event names:

```text
<context><State><Detail?>
```

* **context** : component or phase (bootstrap, stage, i18n…)
* **state** : state or action (init, ready, missing, hooking…)
* **detail** : optional precision (File, Message, Keys…)

---

### Best practices

* Use short but explicit names
* Strictly respect the mapping with event names
* Avoid any ambiguity or non-standard abbreviation
* Do not introduce synonyms (ex: `done` instead of `ready`)

---

### Objective

Keys must make it possible to:

* use them simply in code (`events.bootstrapInit`)
* have an immediate mapping with the event system
* have overall consistency between code and reference

They constitute an **ergonomic alias** of the full event name.

---

## CoreError — Reference

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

## Events - Reference

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

## all details and information of Events

* **`Parser Warnings will be reworked at a later stage`**

* ts/lib/helpers/ParsingHelpers.ts:

  * **current parsing errors use an internal system that stores errors in a dict returned to the runner**

  * we list all parsing issues here for a future update toward eventMessage ->

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

a parserIssue is built this way today:

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

issues are stored in ParserManager in this form:

```ts
private result: ParsedCliContextResult = {
  context: {},
  ignored: [],
  issues: []
 };
```

---
