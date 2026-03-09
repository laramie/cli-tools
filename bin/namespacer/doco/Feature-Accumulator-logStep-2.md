# Feature: Accumulator.logStep (v2)

## Purpose

Provide a simple, *atomic* `logStep(Step)` call that records a linear stream of steps, retaining the Step objects in the order they were added with `logStep` calls, so they can be presented as just a list of their `logline` properties, or as a JSON array of full `Step` JSON representations. See [Step (data model)](#step-data-model) for details.

## Discussion


Currently, `Accumulator._loglinesArray` is an array of objects, with one object added to the array with `push` per call to `accumulate()`.
```js
Accumulator.accumulate(logline);
```

The main output method for presenting views of the `Accumulator._loglinesArray` is `getAccumulatorPrintout(printOptions)` where printOptions has two properties: 
```js
const printOptions = { printObjects: true, prettyObjects: true };
```         

Currently, `accumulate()` is allowed to handle an argument of a logline as a string, with an optional additional arugument of an object to be nested. The new function, `logStep()` will deal with this differently, and eventually we will get rid of `accumulate()`


We want to ensure that the method `logStep(Step)` accumulates entries that are objects of type Step rather than a string.  Currently this method minimally just uses Array `push` to populate its own Step accumulation:
```js
this._stepsArray.push(step); 
```
In this way, the second data structure, `Accumulator._stepsArray` is parallel and separate from `Accumulator._loglinesArray` .

Since Step contains a `logline` property, `logStep()` needs only one arg.  See [Step (data model)](#step-data-model) for details

```js
logStep(Step)
```

We will implement the empty method `getStepsPrintout(printOptions)` to do basically what `getAccumulatorPrintout(printOptions)` does, but rewriting that implementation so it is correct for Step object and rejects a wrongly-called invocation with a simple string arg.


Then we will migrate all calls to Accumulator.accumulate() to use Accumulator.logStep() instead.

All callers other than Accumulator and StepAccumulator should *only* call through the Decorator, StepAccumulator.  They will be given an instance at contruction time, the way PlanRunner does: 

```js
const replacerStepAccumulator = Accumulator.getStepInstance("Replacer");

const replacer = new Replacer(this.namespacerPlan, replacerStepAccumulator);
       

```



---

## Step (data model)

A `Step` is a small JSON-serializable record.
- It is implemented in class Step in file [Step.js](../Step.js)

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
- `SUBSTEP` (📂)
- `LEAVESTEP` (↩)
- `CONTENTS` (📄)
- `INFO` (👉)
- `WARNX` (❌)
- `STOP` (🛑)
- `GENERATE` (🎲)
- `BEETLE` (🪲) *(reserved)*
- `BULLET` (●) *(uncategorized)*

If the codebase contains additional getters, they are also allowed as `icon` values.

---

## Step.stepID

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

`StepAccumulator` is an existing decorator over the singleton `Accumulator`.  Previously, StepAccumulator behaved polymorphically, pretending to be an Accumulator.  In the current design, we want callers to know that the interface is StepAccumulator, but they will be handed a properly constructed StepAccumulator in their constructor, the way PlanRunner does.

### Responsibility

- Own and manage the current hierarchical `stepID` stack.
- Provide push/pop helpers so callers do not manually concatenate dotted paths.

### Proposed API for StepAccumulator

Note that since empty strings are invalid stepID values, the whole stepID for stashing in Step objects is the value returned by `currentStepID()`.  Looking at [Step.stepID](#Step-stepID) there is an example there, such that `Generator` is a valid stepID.  Then, when `pushSubstep("Interfaces")` is called, `currentStepID()` should return `"Generator.Interfaces"`. Then when `pushSubstep("ISong")` is called, currentStepID should return "Generator.Interfaces.ISong". 

- `pushSubstep(substepID)`
  - Push a substepID onto the stack.  
  - then, call logStep() with logline "entering substep"+substepID with `Emoji.SUBSTEP()`
- `popSubstep()`
  - call logStep() with logline "leaving substep "+getCurrentStepID() and `Emoji.LEAVESTEP()`
  - then, Pop the most recent substepID.  
- `currentStepID()`
  - Return the current dotted path (dot-join of steps and substeps).
- `logStep(Step)`
  - call `Accumulator.logStep(Step)` but ensure that the `stepID` of `Step` is filled out using `StepAccumulator.this` knowledge of `currentStepID()`.   
- `logFile(logline, filename)`
  - call `Accumulator.logStep(Step)` filling in fields, and attaching `Emoji.FILEACCESS()`
- `logLine(logline)`
  - call Accumulator.logStep(Step)` filling in fields
- `logObject(logline,bigObject)`
  - call Accumulator.logStep(Step)` filling in fields

Additionally, ways of creating a StepAccumulator should enforce that a starting stepID is passed in, e.g. `"Generator"`



### Interaction with logStep

When logging through `StepAccumulator`:
- If `step.stepID` is unset, set it to `currentStepID()`.
- Then forward to the underlying singleton `Accumulator.logStep(step)`.

---

## Minimal Step JSON example

```json
{
  "stepID": "Generator.interfaces.ISong",
  "icon": "FILEACCESS",
  "level": "info",
  "logline": "read ISong excludes",
  "obj": {
    "path": "data/plan/ISong.js.excludes.plan",
    "excludes": ['clearAll','flashLabel']
  }
}
```