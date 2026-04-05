# Scan Report

## Scope

- Workspace inventory pass read `307` matching files (`21,767,475` bytes) across the root project.
- Top-level split:
  - `miller-web`: `51` app/runtime/config/report files
  - `miller`: `255` upstream engine docs/config/test-fixture files
  - root docs: `1` file
- Runtime analysis focused on `miller-web`, plus the bundled engine contract exposed through `bin/transform-engine.exe` and the upstream Miller docs/help output needed to verify command semantics.

## App Overview

Gridcraft Studio is a Next.js App Router workspace for structured-text transformations. The browser posts `{ input, command, inputFormat, outputFormat }` to [`app/api/run/route.ts`](/Users/chait/authos/t2/miller-web/app/api/run/route.ts), the route validates/sanitizes the request, launches the local engine executable with structured arguments via `execa`, and returns stdout/stderr as JSON.

## UI Components

- [`app/page.tsx`](/Users/chait/authos/t2/miller-web/app/page.tsx): server entry that restores shared URL state.
- [`components/GridcraftStudio.tsx`](/Users/chait/authos/t2/miller-web/components/GridcraftStudio.tsx): main client orchestrator.
- [`components/InputPanel.tsx`](/Users/chait/authos/t2/miller-web/components/InputPanel.tsx): raw input textarea, format selector, sample loader, size counter.
- [`components/CommandBar.tsx`](/Users/chait/authos/t2/miller-web/components/CommandBar.tsx): command input, output-format selector, run trigger, history keys.
- [`components/OutputPanel.tsx`](/Users/chait/authos/t2/miller-web/components/OutputPanel.tsx): output viewer, errors, copy/download, execution summary.
- [`components/VirtualizedOutput.tsx`](/Users/chait/authos/t2/miller-web/components/VirtualizedOutput.tsx): line-windowed renderer above 500 lines.
- [`components/OperationsReference.tsx`](/Users/chait/authos/t2/miller-web/components/OperationsReference.tsx): insertable operations catalog.
- [`app/error.tsx`](/Users/chait/authos/t2/miller-web/app/error.tsx) and [`app/global-error.tsx`](/Users/chait/authos/t2/miller-web/app/global-error.tsx): render/runtime fallbacks.

## User Interactions

- Paste/edit/clear raw input in the textarea.
- Choose input format: `csv`, `tsv`, `json`, `ndjson`, `dkvp`.
- Choose output format separately.
- Type full command chains with `then`.
- Run via button or global `Cmd/Ctrl+Enter`.
- Navigate command history with `ArrowUp` / `ArrowDown`.
- Load the sample dataset.
- Select and run 6 presets.
- Open/collapse the operations reference.
- Click an operation to insert starter syntax.
- Copy output to clipboard.
- Download output with a timestamped extension-aware filename.
- Share/reload workspace state via `?state=...` URL param.

## Execution Path

- Route: [`app/api/run/route.ts`](/Users/chait/authos/t2/miller-web/app/api/run/route.ts)
- Strategy: API route, not WASM
- Binary resolution: `bin/transform-engine.exe` on Windows
- Request limits:
  - input: `10 MB`
  - command length: `2000` chars
  - execution timeout: `10s`
- Concurrency:
  - client request IDs guard stale responses
  - client `AbortController` cancels in-flight requests on unmount
  - server session lock prevents overlapping runs per workspace session

## Supported Formats

- Input/output: `CSV`, `TSV`, `JSON`, `NDJSON`, `DKVP`
- Verified matrix: CSV/TSV/JSON/NDJSON identity conversion and cross-conversion all pass through `/api/run`

## Operation Catalog

The reference currently exposes 70 operations:

`altkv`, `bar`, `bootstrap`, `case`, `cat`, `check`, `clean-whitespace`, `count`, `count-distinct`, `count-similar`, `cut`, `decimate`, `fill-down`, `fill-empty`, `filter`, `flatten`, `format-values`, `fraction`, `gap`, `grep`, `group-by`, `group-like`, `gsub`, `having-fields`, `head`, `histogram`, `join`, `json-parse`, `json-stringify`, `label`, `latin1-to-utf8`, `least-frequent`, `merge-fields`, `most-frequent`, `nest`, `nothing`, `put`, `regularize`, `remove-empty-columns`, `rename`, `reorder`, `repeat`, `reshape`, `sample`, `sec2gmt`, `sec2gmtdate`, `seqgen`, `shuffle`, `skip-trivial-records`, `sort`, `sort-within-records`, `sparsify`, `split`, `ssub`, `stats1`, `stats2`, `step`, `sub`, `summary`, `surv`, `tac`, `tail`, `tee`, `template`, `top`, `unflatten`, `uniq`, `unspace`, `unsparsify`, `utf8-to-latin1`

Policy-limited in the web workspace:

- `join`
- `split`
- `tee`
- `template`
- `put -f`
- `filter -f`
- DSL host-access helpers such as `system()`, `exec()`, `stat()`

Compatibility shims added in the web app:

- `uniq -f key` -> `head -n 1 -g key`
- `format-values -f %.2f -k score` -> `put '$score = fmtnum($score, "%.2f")'`

## State Model

Reducer-managed state in [`lib/studioState.ts`](/Users/chait/authos/t2/miller-web/lib/studioState.ts):

- `input`
- `command`
- `inputFormat`
- `outputFormat`
- `selectedPresetId`
- `isReferenceOpen`
- `execution.status`
- `execution.output`
- `execution.errorMessage`
- `execution.runSummary`
- `history.items`
- `history.index`
- `history.draft`
- `copyStatus`
- `statusMessage`

Ref-managed ephemeral state in [`components/GridcraftStudio.tsx`](/Users/chait/authos/t2/miller-web/components/GridcraftStudio.tsx):

- active `AbortController`
- latest request ID
- session ID

## Dependencies

Runtime npm packages:

- `next`
- `react`
- `react-dom`
- `execa`
- `zod`

Build/test dependencies used by the app:

- `typescript`
- `eslint`
- `eslint-config-next`
- `tailwindcss`
- `postcss`
- `@next/bundle-analyzer`
- `@types/node`
- `@types/react`
- `@types/react-dom`

Local/runtime non-npm dependencies:

- `bin/transform-engine.exe`
- bundled upstream `miller` source/docs/tests

Transient QA tooling installed locally during the audit without editing `package.json`:

- `playwright`
- `axe-core`

## Environment Variables

- `ENGINE_BINARY_PATH` in [`scripts/prepare-engine.mjs`](/Users/chait/authos/t2/miller-web/scripts/prepare-engine.mjs): optional install-time binary source
- `NODE_ENV` in [`next.config.mjs`](/Users/chait/authos/t2/miller-web/next.config.mjs): CSP dev/prod toggle
- `ANALYZE` in [`next.config.mjs`](/Users/chait/authos/t2/miller-web/next.config.mjs): bundle analyzer toggle

## Error Paths

- Client validation failures:
  - empty input
  - empty command
  - oversized input
  - overlong command
- URL-state decode failures: malformed `state` query param falls back to default preset
- API validation failures:
  - invalid JSON body
  - invalid request schema
  - unsupported/invalid formats
  - command tokenization failures
  - workspace policy violations
  - session rate limiting
  - engine unavailable
  - engine timeout
  - engine non-zero exit
  - unexpected execution failures
- Browser API failures:
  - clipboard denial/unsupported clipboard API
  - download API restrictions
- Render failures:
  - route-level error boundary
  - global error boundary

## Baseline Notes

- TypeScript strict flags were already enabled and remain enabled.
- The app already had request cancellation and request-ID stale-response protection in place before fixes; the audit verified those paths and kept them intact.
- Lighthouse baseline captured in dev mode failed with `ERRORED_DOCUMENT_REQUEST` after a build invalidated the running dev server’s `/_next` asset URLs. Final Lighthouse metrics were therefore collected against `next start`, which reflects the production artifact.
