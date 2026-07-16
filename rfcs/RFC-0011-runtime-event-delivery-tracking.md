# RFC — Runtime Event Delivery Tracking & Historical Replay

## Motivation

The Core currently allows runtime output listeners to be registered dynamically (typically during the `globals` stage once configuration and i18n are fully resolved).

This creates a limitation.

Events emitted before listener registration are permanently lost for that listener.

Typical example:

```text
Bootstrap
 ↓
Parser
 ↓
Globals
 ↓
register custom console/logger
```

Any informational events emitted before `globals` cannot be rendered by the custom listener.

Today this is acceptable because the builtin CoreConsole is always active, but it prevents:

* historical replay
* late logger initialization
* runtime configurable outputs
* future multi-output systems

---

## Goals

Introduce an optional replay mechanism allowing newly registered output listeners to receive past runtime events.

Replay must:

* respect existing filtering
* never duplicate already delivered events
* require no change to i18n
* preserve the Event-first architecture

---

## New Runtime Property

Each RuntimeEvent gains an internal delivery state.

```ts
dispatched: Partial<
    Record<
        keyof FinalEventsChannels<TChannels>,
        true
    >
>
```

Meaning:

```text
missing key
    => never delivered

true
    => already delivered on this channel
```

Example

```json
{
    id: "...",
    name: "...",

    dispatched: {
        default: true,
        logger: true
    }
}
```

No false values are stored.

Missing key == false.

---

## Listener API

Extend output listener registration.

```ts
tools.events.addListener(handler, {
    channel: "logger",
    level: "debug",
    scope: "core",

    replayPastEvents: "missing"
})
```

New option

```ts
replayPastEvents?: "none" | "missing" | "full"
```

Default

```text
"none"
```

---

## Replay Policy

Replay happens immediately after listener registration.

Pseudo flow

```text
register listener
        │
        ▼
register internally
        │
        ▼
replayPastEvents?
        │
        ├── no
        │      done
        │
        ▼
iterate Runtime Live Events
        │
        ▼
apply normal listener filters

(level)

(scope)

(event selector)

(channel delivery)

        │
        ▼
handler(...)
        │
        ▼
_printRuntimeEvent(...)
        │
        ▼
runtimeEvent.dispatched[channel] = true
```

---

## Filtering

Replay must reuse the exact same filtering policy as live dispatch.

Meaning:

```text
channel
level
scope
event selector
```

No special replay logic should exist.

Replay simply executes the normal output pipeline on historical events.

---

## Dispatcher Changes

Current dispatcher:

```text
listener

↓

handler()

↓

_printRuntimeEvent()
```

becomes

```text
listener

↓

already dispatched ?

↓

no

↓

handler()

↓

_printRuntimeEvent()

↓

runtimeEvent.dispatched[channel]=true
```

The same logic is reused for replay.

---

## Why Runtime?

Delivery state is not part of the event declaration.

It is purely runtime information.

It depends on:

* listener registration
* execution order
* active channels

Therefore it naturally belongs inside RuntimeEvent.

---

## Why Not Parser Events?

Earlier discussions considered:

* Parser Event kind
* Diagnostics
* Event attachments

These solutions introduce special event categories.

Delivery tracking is more generic.

It solves:

* parser warnings
* late logger initialization
* future dynamic outputs

without introducing new event semantics.

---

## Future Possibilities

This runtime information naturally enables:

```text
Late logger activation

↓

Historical console rendering

↓

Deferred outputs

↓

Replay after plugin loading

↓

Runtime channel hot swapping
```

without modifying the event declaration model.

---

## Non Goals

This RFC does **not** modify:

* i18n
* Event declaration
* CoreEventKind
* CoreEvent structure

The change is strictly limited to RuntimeEvent delivery state and listener registration.

---
