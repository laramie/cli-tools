# Fix Plan: code-review-20260311

## Purpose

This document turns the findings from [code-review-20260311.md](/home/laramie/infinite-neck/bin/namespacer/doco/code-review-20260311.md) into an implementation sequence.

The main goal is to stabilize the namespacer pipeline in this order:

1. Stop generating broken code.
2. Make the runner operationally reliable.
3. Align logging and outputs with the documented design.
4. Improve feature completeness only after the pipeline is trustworthy.

---

## Recommended Order

### Phase 1: Stop incorrect output generation

This phase is highest priority because the current tool can emit invalid JavaScript.

#### 1.1 Restrict replacement to real invocation sites

Current problem:
- [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js#L257) detects candidate lines with a regex that does not distinguish declarations from calls.
- [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js#L285) replaces the first matching identifier on the line.
- This causes invalid output such as [generated-song.js](/home/laramie/infinite-neck/bin/namespacer/data/out/generated-song.js#L204) and [generated-notetable.js](/home/laramie/infinite-neck/bin/namespacer/data/out/generated-notetable.js#L700).

Recommended fix:
- Replace the current line-oriented replacement logic with one of these approaches:
  1. Preferred: parse source with Babel or Recast and rewrite only CallExpression callee identifiers.
  2. Minimum safe interim fix: add explicit guards to skip function declarations, exports, method declarations, property keys, and already-qualified names.

Acceptance criteria:
- `node --check` passes for every generated file in `data/out/`.
- No transformed line contains `function Namespace.identifier(`.
- No transformed line contains `export function Namespace.identifier(`.

#### 1.2 Add output validation to the pipeline

Current problem:
- PlanRunner completes even when generated code is syntactically invalid.

Recommended fix:
- After `replacer.processAllSources(masterNamespaceMap)` in [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L129), run syntax validation over generated `.js` files in `data/out/`.
- Fail the run if any generated file does not parse.
- Log those failures through StepAccumulator so they appear in the accumulator output.

Acceptance criteria:
- A bad transformation causes a non-zero exit code.
- The accumulator includes a clear failure step for invalid output files.

---

### Phase 2: Fix facade generation

This phase addresses the current unusable `I*` outputs.

#### 2.1 Separate legacy input path from generated output path

Current problem:
- [GenerateInterface.js](/home/laramie/infinite-neck/bin/namespacer/GenerateInterface.js#L43) passes `namespaceObj.sourceout` as the import target.
- For `IInfiniteNeck`, that produces a self-referential path in [IInfiniteNeck.js](/home/laramie/infinite-neck/bin/namespacer/data/out/IInfiniteNeck.js#L1).

Recommended fix:
- Extend each namespace config object in [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L19) with an explicit `legacySource` field.
- Use `legacySource` for the import path and `sourceout` only for file output.
- Normalize import paths relative to the generated file location, not relative to the current working directory.

Acceptance criteria:
- Generated facade imports point to the intended legacy module.
- Import paths remain correct regardless of where PlanRunner is launched from.

#### 2.2 Export the generated facade class

Current problem:
- [GenerateInterface.js](/home/laramie/infinite-neck/bin/namespacer/GenerateInterface.js#L95) generates a class declaration but does not export it.

Recommended fix:
- Emit either `export class InterfaceName` or `export default class InterfaceName`.
- Decide one consistent convention for all generated facade files.

Acceptance criteria:
- Importing a generated facade returns a usable exported symbol.

#### 2.3 Clarify facade intent in configuration

Current problem:
- The config schema in [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L19) does not distinguish between:
  - source file to scan
  - legacy implementation file to wrap
  - plan file to read
  - output file to write

Recommended fix:
- Define a stricter config schema, for example:

```js
{
  namespace: "IInfiniteNeck",
  legacyImpl: "infiniteNeckImpl",
  legacySource: "./data/src/infinite-neck.js",
  bareList: "./data/plans/infinite-neck.js.functions.gen",
  interface: "./data/plans/infinite-neck.js.functions.gen",
  excludes: "",
  sourceout: "./data/out/IInfiniteNeck.js"
}
```

Acceptance criteria:
- A reader can understand each field without reading GenerateInterface internals.

---

### Phase 3: Make PlanRunner operationally reliable

This phase removes fragile runtime assumptions.

#### 3.1 Stop depending on the current working directory

Current problem:
- Running `node ./bin/namespacer/PlanRunner.js` from the repo root fails because `data/src` is resolved relative to the wrong directory.

Recommended fix:
- Resolve all PlanRunner paths relative to the location of [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js), using `import.meta.url` and `fileURLToPath`.
- Convert the config objects at the top of the file to either absolute paths internally or normalized paths at startup.

Acceptance criteria:
- The runner works from:
  - the namespacer directory
  - the repository root
  - any other working directory

#### 3.2 Use a real config file or stop pretending to

Current problem:
- [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L107) logs `runconfig-example.json`, but [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L118) actually uses the hard-coded object.

Recommended fix:
- Pick one of these approaches:
  1. Read `runconfig-example.json` for real via `findMain.runWithNamedOptionsFile(...)`.
  2. Keep in-file config, but remove the misleading log message and comments.

Acceptance criteria:
- Logged config source matches actual behavior.

#### 3.3 Add explicit run result status

Recommended fix:
- Have PlanRunner track whether each phase succeeded:
  - search
  - interface generation
  - replacement
  - validation
- Emit a final summary step and return a non-zero process exit on failure.

Acceptance criteria:
- A failed phase is visible both in stdout and in accumulator output.

---

### Phase 4: Repair plan-file handling

This phase makes the middle of the workflow consistent with the docs.

#### 4.1 Fix broken error branches in Replacer

Current problem:
- [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js#L206) references `errmsg1` in the `NOT_FOUND` branch.
- [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js#L224) references `errmsg` in the default branch.

Recommended fix:
- Correct those variable names.
- Add small tests for:
  - missing plan file
  - unreadable plan file
  - empty plan file

Acceptance criteria:
- All plan loading failures log the correct message and do not crash unexpectedly.

#### 4.2 Decide whether FindMain generates plan files

Current problem:
- The docs imply `FindMain` produces plan files, but the current runner only scans and logs.

Decision needed:
- Option A: FindMain should write `.gen` files during the PlanRunner run.
- Option B: FindMain is intentionally read-only, and plan files are maintained separately.

Recommended direction:
- If the long-term intent is full pipeline automation, implement Option A.
- If manual curation is a feature, document it clearly and update the checklist docs to stop claiming plan generation is already implemented.

Acceptance criteria:
- The documented workflow and actual workflow match.

#### 4.3 Separate scan output from curated plan input

Recommended fix:
- Treat `*.functions.gen` as generated discovery output.
- Treat `*.plan` and `*.interface.plan` as curated inputs.
- Add a documented or scripted copy/promote step from `.gen` to curated plans.

Acceptance criteria:
- Developers can tell which files are generated and which are hand-maintained.

---

### Phase 5: Bring accumulator behavior back in line with the design

This phase improves trust in the debugging and reporting output.

#### 5.1 Make `_accumulator.steps.json` actually JSON

Current problem:
- [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js#L92) sets `oneLiner: true`.
- [Accumulator.js](/home/laramie/infinite-neck/bin/namespacer/Accumulator.js#L240) writes that text output into `_accumulator.steps.json`.

Recommended fix:
- Write structured JSON to `_accumulator.steps.json`.
- If the one-line ANSI view is still useful, write it to a separate text file, for example `_accumulator.steps.txt`.

Acceptance criteria:
- `_accumulator.steps.json` parses as JSON.
- Human-readable text output is still available separately if desired.

#### 5.2 Enforce `Step` objects at the accumulator boundary

Current problem:
- [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js#L218) passes a plain object to `logStep`.

Recommended fix:
- Make `Accumulator.logStep` validate its input or normalize it through `new Step(...)`.
- Update call sites to use `this.accumulator.newStep(...)` consistently.

Acceptance criteria:
- No caller passes raw objects into `Accumulator.logStep`.

#### 5.3 Stop embedding color codes in structural fields

Current problem:
- [Accumulator.js](/home/laramie/infinite-neck/bin/namespacer/Accumulator.js#L208) stores ANSI-colored content inside `stepID`, `logline`, and `path` for file I/O debug steps.

Recommended fix:
- Keep raw step data plain.
- Apply color only in the rendering layer.

Acceptance criteria:
- Step objects remain machine-readable regardless of output mode.

#### 5.4 Use hierarchical step IDs consistently

Recommended fix:
- Make all logging go through StepAccumulator for normal flow.
- Reserve direct Step construction for exceptional cases only.
- Use nested step IDs for phases like:
  - `PlanRunner.FindMain`
  - `PlanRunner.Replacer.Interfaces`
  - `PlanRunner.Replacer.Replace.song.js`

Acceptance criteria:
- The accumulator output reflects the actual workflow hierarchy.

---

### Phase 6: Update docs after code behavior is settled

Current problem:
- Some docs describe intended behavior more than actual behavior.

Recommended fix:
- Update these after implementation stabilizes:
  - [namespacer-overview.generated.md](/home/laramie/infinite-neck/bin/namespacer/doco/namespacer-overview.generated.md)
  - [Feature-Accumulator-logStep-2.md](/home/laramie/infinite-neck/bin/namespacer/doco/Feature-Accumulator-logStep-2.md)
  - any runconfig or workflow examples

Acceptance criteria:
- Each doc clearly distinguishes implemented behavior from planned behavior.

---

## Suggested Milestones

### Milestone A: Safe transformer

Deliverables:
- No syntactically broken generated files
- validation step in PlanRunner
- corrected error handling in Replacer

### Milestone B: Working facades

Deliverables:
- correct facade import paths
- exported facade classes
- explicit legacySource config

### Milestone C: Honest workflow

Deliverables:
- clear decision on generated versus curated plan files
- docs updated to match behavior
- accumulator JSON output made real

### Milestone D: Developer usability

Deliverables:
- runner works from any cwd
- final summary status and reliable exit codes
- clearer step hierarchy in logs

---

## Short Version

If you want the shortest path to value, do this first:

1. Fix Replacer so it never rewrites declarations.
2. Add syntax validation on generated output.
3. Fix facade import/export generation.
4. Fix the broken error branches in plan loading.
5. Make `_accumulator.steps.json` actual JSON.
6. Decide whether plan files are generated or curated, then update docs to match.