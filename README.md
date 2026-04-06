# Gridcraft Studio

Gridcraft Studio is a data transformation workspace for structured text formats. Paste tabular or record-based input, run command chains, switch output formats, compare row counts, and share the exact workspace state through the URL.

## Features

- Paste and transform CSV, TSV, JSON, NDJSON, and DKVP input
- Run chained transformation commands from a single command bar
- Load example presets for filtering, reordering, reshaping, and summary stats
- Browse a reference list of supported operations and insert starter syntax
- Copy results, download them as files, and share the current workspace state by URL
- View execution time plus input and output row counts after each successful run

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL printed by Next in the terminal.

4. Create a production build any time with:

   ```bash
   npm run build
   ```

The bundled `postinstall` step prepares `bin/transform-engine` automatically. If you need to override the bundled engine during install, set `ENGINE_BINARY_PATH` before running `npm install`.

## Supported formats

- CSV
- TSV
- JSON
- NDJSON
- DKVP

## Supported operations

Gridcraft Studio ships with a broad command reference, including:

- `cat`
- `cut`
- `filter`
- `head`
- `tail`
- `sort`
- `rename`
- `reorder`
- `uniq`
- `count`
- `stats1`
- `stats2`
- `histogram`
- `reshape`
- `flatten`
- `unflatten`
- `label`
- `put`
- `step`
- `format-values`
- `fill-down`
- `fill-empty`
- `skip-trivial-records`

Some file-oriented or side-output operations remain visible in the reference but are intentionally limited by the execution policy inside the workspace.

## URL sharing

Every run updates the page URL with the current input, command, input format, and output format. Opening that link restores the same workspace state, which makes it easy to hand off reproducible examples.

## Execution layer

The app uses a server-side execution route. Requests are posted to `app/api/run/route.ts`, validated, and passed to the local engine executable with structured arguments instead of a shell string. The route enforces input-size limits, command-length limits, execution timeout handling, and workspace-specific policy checks before the process starts.

## Adding new operation examples

Update `lib/operations.ts`.

- Add or improve an entry in `curatedOperationContent`
- Set `description` to the one-line explanation shown in the sidebar
- Set `example` to the minimal display example
- Set `insertText` to the syntax inserted into the command bar on click

## Workspace structure

- `app/page.tsx`: mounts the main studio view
- `components/GridcraftStudio.tsx`: main UI state and interactions
- `components/OperationsReference.tsx`: reference sidebar
- `app/api/run/route.ts`: execution endpoint and error normalization
- `scripts/prepare-engine.mjs`: engine preparation script
- `ARCHITECTURE_NOTES.md`: architecture summary
