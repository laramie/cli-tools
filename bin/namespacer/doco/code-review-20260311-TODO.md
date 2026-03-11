# TODO: code-review-20260311

This TODO list is derived from [code-review-20260311.md](/home/laramie/infinite-neck/bin/namespacer/doco/code-review-20260311.md) and the implementation sequence in [code-review-20260311-fix-plan.md](/home/laramie/infinite-neck/bin/namespacer/doco/code-review-20260311-fix-plan.md).

## Priority 0: Prevent broken output

- [ ] Replace the current line-based rewrite logic in [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js) with invocation-aware rewriting.
- [ ] Ensure declarations are never rewritten into forms like `function Namespace.identifier(`.
- [ ] Ensure export declarations are never rewritten into forms like `export function Namespace.identifier(`.
- [ ] Add syntax validation for every generated file in `data/out/` at the end of a PlanRunner run.
- [ ] Make PlanRunner exit non-zero when generated output fails syntax validation.

## Priority 1: Fix facade generation

- [ ] Add a `legacySource` field to namespace config objects in [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js).
- [ ] Change [GenerateInterface.js](/home/laramie/infinite-neck/bin/namespacer/GenerateInterface.js) to import from `legacySource`, not `sourceout`.
- [ ] Resolve generated import paths relative to the output file location.
- [ ] Export the generated facade class from each `I*.js` file.
- [ ] Verify that [IInfiniteNeck.js](/home/laramie/infinite-neck/bin/namespacer/data/out/IInfiniteNeck.js) imports a real legacy module and exports a usable class.

## Priority 2: Fix known correctness bugs

- [ ] Fix the wrong variable reference in the `NOT_FOUND` branch of [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js).
- [ ] Fix the wrong variable reference in the default error branch of [Replacer.js](/home/laramie/infinite-neck/bin/namespacer/Replacer.js).
- [ ] Add tests for missing, empty, and unreadable plan files.
- [ ] Add tests that prove transformed outputs remain syntactically valid.

## Priority 3: Make PlanRunner robust

- [ ] Resolve all runner paths relative to [PlanRunner.js](/home/laramie/infinite-neck/bin/namespacer/PlanRunner.js) instead of the current working directory.
- [ ] Make `node ./bin/namespacer/PlanRunner.js` work from the repository root.
- [ ] Decide whether PlanRunner should read `runconfig-example.json` for real or stop logging that it does.
- [ ] Make the final run result explicit with success/failure status and exit code.

## Priority 4: Clarify the plan-file workflow

- [ ] Decide whether FindMain should generate `.functions.gen` files during a PlanRunner run.
- [ ] If yes, implement generation of `.functions.gen` files from FindMain output.
- [ ] If no, update docs to state clearly that FindMain is read-only in the runner.
- [ ] Distinguish generated files from curated files in `data/plans/`.
- [ ] Define or script the promotion flow from `.gen` files to `.plan` and `.interface.plan` files.

## Priority 5: Repair accumulator output semantics

- [ ] Make [_accumulator.steps.json](/home/laramie/infinite-neck/bin/namespacer/_accumulator.steps.json) valid JSON.
- [ ] Move the one-line ANSI view to a separate text artifact if that format is still wanted.
- [ ] Ensure `Accumulator.logStep` receives only Step objects or normalizes raw inputs into Step objects.
- [ ] Replace raw-object `logStep` calls with StepAccumulator-based calls.
- [ ] Keep ANSI color codes out of stored Step fields.
- [ ] Use StepAccumulator hierarchy consistently for phase and substep logging.

## Priority 6: Update docs to match reality

- [ ] Update [namespacer-overview.generated.md](/home/laramie/infinite-neck/bin/namespacer/doco/namespacer-overview.generated.md) so implemented behavior and planned behavior are clearly separated.
- [ ] Update [Feature-Accumulator-logStep-2.md](/home/laramie/infinite-neck/bin/namespacer/doco/Feature-Accumulator-logStep-2.md) if the logging implementation changes.
- [ ] Document the intended meaning of each namespace config field.
- [ ] Document the actual run order once the workflow is finalized.

## Suggested test checklist

- [ ] Run PlanRunner from `bin/namespacer/` successfully.
- [ ] Run PlanRunner from the repository root successfully.
- [ ] Parse every generated `data/out/*.js` file with `node --check`.
- [ ] Import at least one generated facade module successfully.
- [ ] Confirm `_accumulator.steps.json` parses as JSON.
- [ ] Confirm run failure is visible in both stdout and accumulator output when validation fails.

## Deferred but worthwhile

- [ ] Replace regex-driven transformation with AST-based rewriting using Babel or Recast.
- [ ] Add a schema validator for PlanRunner namespace config objects.
- [ ] Split scan, generation, replacement, and validation into explicit pipeline stages with separate reporting.
- [ ] Add a compact machine-readable run summary artifact in addition to the detailed accumulator log.