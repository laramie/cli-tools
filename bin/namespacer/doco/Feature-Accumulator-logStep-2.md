# Feature: Accumulator.logStep (v2)

## Purpose

Provide a simple, *atomic* `logStep(step)` call that records a linear stream of steps, while retaining enough structure to mentally (or programmatically) reconstruct a nested "step tree".

The accumulator may internally maintain a large logical tree of steps, but each `logStep` invocation is treated as a single append-only event.

---

## Step (data model)

A `Step` is a small JSON-serializable record.

### Required fields

- `stepID` (string)
- `logline` (string)
- `obj` (object; may be `{}`)

### Recommended fields

- `icon` (string; Emoji getter name)
- `level` (string)

---

## Step.level

`Step.level` expresses severity/importance (not hierarchy).

Allowed values:
- `debug`
- `info` *(default)*
- `warn`
- `error`

---

## Step.icon

`Step.icon` is a string equal to one of the *getter names* on `Emoji` (see `bin/namespacer/Emoji.js`).

### Icon semantics

- **Reserved:** `BEETLE` (🪲)
  - Reserved value meaning *the caller did not specify an icon*.
  - If `Step.icon` is missing/empty, the system defaults it to `BEETLE` (so downstream tooling can distinguish "unspecified" from "explicitly BULLET").

- **Uncategorized:** `BULLET` (●)
  - Use when the step is a normal sub-point that does not warrant a specialized icon.

### Baseline allowed icons (initial set)

This document assumes (at minimum) these Emoji getters exist:
- `FILEACCESS` (💾)
- `FILEINFO` (📂)
- `CONTENTS` (📄)
- `INFO` (👉)
- `WARNX` (❌)
- `STOP` (🛑)
- `GENERATE` (🎲)
- `BEETLE` (🪲) *(reserved)*
- `BULLET` (●) *(uncategorized)*

If the codebase contains additional getters, they are also allowed as `icon` values.

---

## Step.stepID (hierarchical dotted path)

`Step.stepID` is a **dotted hierarchy** that encodes phase and nesting.

Examples:
- `Generator`
- `Generator.interfaces`
- `Generator.interfaces.ISong`

Interpretation:
- The first segment (e.g. `Generator`) functions as a "phase" label.
- Additional segments represent nested scope.

### Why dotted stepIDs

- The log remains an atomic *linear* sequence of `logStep` events.
- The dotted `stepID` provides enough structure to reconstruct a nested tree later (via a separate tool) or to read the log "as if" it were a tree.

### Bullet points under a scope (Option B)

Within a given scope (e.g. `Generator.interfaces.ISong`), multiple steps may share the same `stepID` and differ only by `icon`, `level`, `logline`, and `obj`.

This keeps each `logStep` atomic while allowing many bullet-like actions to be grouped under the same logical node when reconstructed.

---

## StepAccumulator (stepID push/pop stack)

`StepAccumulator` is an existing decorator over the singleton `Accumulator`.

### Responsibility

- Own and manage the current hierarchical `stepID` stack.
- Provide push/pop helpers so callers do not manually concatenate dotted paths.

### Proposed API

- `pushStepID(segment)`
  - Push a segment onto the stack.
- `popStepID()`
  - Pop the most recent segment.
- `withStepID(segment, fn)`
  - Convenience wrapper: push → run `fn` → pop (ensure pop via `try/finally`).
- `currentStepID()`
  - Return the current dotted path (dot-join of segments).

### Interaction with logStep

When logging through `StepAccumulator`:
- If `step.stepID` is unset, set it to `currentStepID()`.
- Then forward to the underlying singleton `Accumulator.logStep(step)`.

---

## Minimal Step JSON example (updated)

```json
{
  "stepID": "Generator.interfaces.ISong",
  "icon": "FILEACCESS",
  "level": "info",
  "logline": "read file bin/namespacer/Emoji.js",
  "obj": {
    "path": "bin/namespacer/Emoji.js",
    "bytes": 2004
  }
}
```