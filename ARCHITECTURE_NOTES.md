# Gridcraft Studio Architecture Notes

## Execution strategy

Gridcraft Studio uses a server-side execution route. The browser sends structured input, command, and format preferences to `app/api/run/route.ts`. The route validates the request, tokenizes the command safely, applies workspace policy checks, and then launches the local engine executable through `execa`.

## Component structure

- `app/layout.tsx`: global metadata, fonts, and shell layout
- `app/page.tsx`: suspense-wrapped entry point for the studio
- `components/GridcraftStudio.tsx`: top-level orchestration for input, command state, output state, presets, history, and URL sharing
- `components/InputPanel.tsx`: raw input editor plus input-format selection
- `components/CommandBar.tsx`: command entry, keyboard shortcuts, output-format selection, and run trigger
- `components/OutputPanel.tsx`: result rendering, error display, download/copy actions, and execution metrics
- `components/OperationsReference.tsx`: collapsible operation catalog with insertable starter syntax

## Data flow

1. The studio loads a default example preset or restores state from the URL.
2. The user edits input, command text, and format settings in the client.
3. Client-side validation checks for empty input, empty commands, and oversized payloads before execution.
4. The app posts the structured request to `/api/run`.
5. The route validates formats, tokenizes the command, applies policy rules, and launches the local engine process.
6. The client receives structured output and error data, computes row counts and timing, and updates the shareable URL state.

## Execution safety

- Requests are limited to 10 MB
- Commands are limited to 1000 characters
- Process execution times out after 10 seconds
- Side-output and file-dependent operations are restricted by policy
- Host-access DSL helpers are blocked before execution

## Supported formats in the workspace

- CSV
- TSV
- JSON
- NDJSON
- DKVP

## Supported operation reference

The operation catalog includes record filtering, field selection, sorting, renaming, reshaping, deduplication, summary statistics, flattening, labeling, and formatting helpers. A few advanced file-dependent operations remain visible for discoverability but are intentionally limited inside the workspace policy layer.
