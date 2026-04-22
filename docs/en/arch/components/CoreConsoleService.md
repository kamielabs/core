# 🧱 CoreConsoleService

## Description

`CoreConsoleService` is the service responsible for displaying core events in the console.

It acts as a **default system listener**, automatically registered with the `EventsManager`.

Its role is to transform runtime events into readable output, based on:

* their type (`signal` or `message`)
* their level (`level`)
* their phase (`phase`)
* the active language (for messages)

It is the default implementation of the core output system.

---

## Purpose

`CoreConsoleService` provides a standard console output for the core, without requiring any additional configuration.

It allows to:

* display runtime events in a structured way
* differentiate levels (info, warning, error, etc.)
* automatically integrate i18n for messages
* provide consistent default behavior

Its goal is simple:

> provide immediate runtime visibility based entirely on the event system.

---

## Why This Service Exists

The core is fully based on an event system.

But without a default output, those events would remain invisible.

`CoreConsoleService` exists to:

* provide a concrete representation of events
* offer a default behavior without configuration
* serve as a foundation for more advanced output systems

It also demonstrates a key core principle:

> outputs are not hardcoded, they are driven by listeners.

---

## Automatic Registration

The service registers itself as a system listener during initialization.

```ts
this.ctx.events.registerSystemListener("*", { handler: this.print, channel: "default" });
````

This means:

* it listens to all events (`*`)
* it operates on the `default` channel
* it is active without developer intervention

This mechanism highlights the system’s power:

> a service can fully integrate into the runtime simply by registering as a listener.

---

## Scope

In v0.1, `CoreConsoleService` is responsible for:

* listening to runtime events
* filtering based on configured level
* formatting events
* displaying signals
* translating and displaying messages
* applying different rendering depending on level

It does not:

* implement business logic
* control execution flow
* make runtime decisions
* store events

It only consumes what `EventsManager` produces.

---

## Level Filtering

The service applies filtering based on a minimum level:

```ts
if (event.level < this._displayLevel) {
  return;
}
```

This level is defined via core settings.

This allows to:

* reduce noise
* adjust verbosity
* control overall output

---

## Event Formatting

Each event is transformed into structured output.

### Base Format

```text
[HH:MM:SS] LEVEL   PHASE
```

With:

* timestamp
* level
* phase

---

### Signals

`signal` events display:

* event code
* optional label
* optional details

Example:

```text
[12:00:00] INFO    BOOTSTRAP bootstrapInit (System) [Gentoo Linux]
```

---

### Messages

`message` events go through the i18n system:

```ts
const msg = await this.ctx.i18n.tr(event.code, event.values);
```

Then are displayed as:

* simple content
* or title + description

Example:

```text
[12:00:00] ERROR   MODULES Module not found
→ The module "user" does not exist
```

---

## Colors and Levels

The service applies visual styles depending on level:

* `trace` / `debug` → console.debug
* `info` → console.info
* `warning` → console.warn (yellow)
* `error` → console.error (red)
* `fatal` → console.error (red background)

This enables quick runtime readability.

---

## Signal vs Message

Behavior depends on the event type.

### Signal

* no translation
* direct display
* usable even without i18n

### Message

* goes through `I18nManager`
* uses dynamic values
* depends on runtime language

This aligns with the core design.

---

## Relationship with i18n

The service directly depends on `I18nManager` to display messages.

This implies:

* before i18n → only `signal` events are reliable
* after i18n → `message` events become usable

The service automatically adapts to this state.

---

## Channels and Extensibility

`CoreConsoleService` uses the `"default"` channel.

Thanks to the channel system:

* a runtime listener can override this behavior
* another output system can replace the console
* multiple outputs can coexist

Examples:

* custom logger
* log file
* JSON output
* UI

👉 Key point:

> the console is just one implementation among others.

---

## Rationale

The design is based on a strong principle:

> the core never prints directly, it emits events.

And:

> output is entirely handled by listeners.

This enables:

* decoupling logic from output
* easy replacement of the display system
* building advanced outputs without modifying the core
* making the runtime observable and extensible

`CoreConsoleService` is simply the default implementation of this principle.

---

## Relationships

### With `EventsManager`

The service fully depends on it:

* to receive events
* to register as a listener

---

### With `I18nManager`

Used to translate messages.

---

### With Core Settings

Used to define display level.

---

### With Other Services

Can be replaced or extended by other output systems via channels.

---

## Current Limitations

In v0.1:

* formatting is still simple
* timestamp is in UTC
* no advanced rendering configuration
* no advanced multi-output handling
* no structured output (JSON, etc.)

These choices are intentional to keep a simple and readable base.

---

## Future Evolutions

Possible improvements include:

* system timezone support
* configurable output formats
* structured output (JSON, logs)
* integration with external loggers
* advanced channel management
* output multiplexing
* revisiting how signals and messages are displayed (more details for signals, full rendering for messages)

The goal is to extend without breaking the core principle.

---

## Conclusion

`CoreConsoleService` is the default implementation of the core output system.

It perfectly illustrates a key architectural principle:

> everything goes through events, including output.

Simple on the surface, it relies on a powerful system:

* listeners
* channels
* complete separation between emission and display

This approach makes the core both:

* readable by default
* extensible without friction

---
