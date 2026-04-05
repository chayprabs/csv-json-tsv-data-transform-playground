# Understanding

## What the app does

Gridcraft Studio is a Next.js 14 App Router application for interactive data transformation. A user pastes structured text input, chooses an input format, writes a command chain, chooses an output format, and runs the command through a local transformation engine exposed behind a server route. The result is shown in the browser, can be copied or downloaded, and the current workspace state can be shared through the URL.

## Execution strategy

- The app uses a server execution route at `app/api/run/route.ts`.
- The browser posts `{ input, command, inputFormat, outputFormat }` to `/api/run`.
- The route validates request shape and size, tokenizes the command, blocks unsupported or dangerous operations, maps format ids to CLI flags, and invokes a local binary with `execa`.
- The binary receives the user input through stdin and returns stdout and stderr.
- The client renders stdout as output and stderr-derived messages as visible errors.

## End-to-end data flow

1. The app boots into a client component, `GridcraftStudio`.
2. Initial state comes from the default preset, unless the URL includes a serialized workspace state.
3. The user edits:
   - raw input text
   - input format
   - command string
   - output format
   - preset selection
4. Before execution, client validation checks:
   - non-empty input
   - non-empty command
   - max input size
   - max command length
5. On run:
   - the share URL is updated
   - command history is updated
   - the UI enters a running state
   - output and prior errors are cleared
6. The browser calls `/api/run`.
7. The route:
   - parses JSON
   - validates formats and sizes
   - tokenizes the command while rejecting shell metacharacters outside quotes
   - blocks unsupported file-backed operations and host-access DSL helpers
   - verifies the engine executable exists
   - executes the engine with stdin input and a timeout
8. The client receives output and error text.
9. The client computes:
   - preview text for large outputs
   - input row count
   - output row count
   - execution duration
10. The output panel renders the final state and enables copy/download actions.

## Component structure

- `app/layout.tsx`: global metadata, local fonts, global styles.
- `app/page.tsx`: mounts the app inside a suspense boundary.
- `components/GridcraftStudio.tsx`: top-level client orchestration, state, routing, execution, history, sharing, and interactions.
- `components/InputPanel.tsx`: input textarea, format selector, load-example action.
- `components/CommandBar.tsx`: command input, output format selector, run action, keyboard shortcuts.
- `components/OutputPanel.tsx`: result preview, error display, copy/download actions, run metrics.
- `components/OperationsReference.tsx`: collapsible operation catalog and insert action.
- `app/api/run/route.ts`: server execution route and command sanitization layer.

## State management approach

The app currently uses local React state inside one large client component. `GridcraftStudio` owns nearly all behavior and data, then passes state and event handlers down into presentational children. There is no reducer, no context, and no dedicated request-state abstraction. This means the main page component currently owns:

- workspace content state
- run lifecycle state
- output/error state
- preset state
- history state
- share URL state
- sidebar state
- copy button feedback state

## Features exposed to users

- Paste structured input into a large textarea.
- Choose input format from:
  - CSV
  - TSV
  - JSON
  - NDJSON
  - DKVP
- Type a full transformation command chain.
- Choose a different output format from the same supported set.
- Run the transformation with a button or `Cmd/Ctrl + Enter`.
- Load a sample dataset.
- Load one of six example presets.
- Browse an operations reference sidebar.
- Insert starter syntax for an operation into the command bar.
- See execution errors inline.
- See output preview inline.
- Copy full output to the clipboard.
- Download full output as a file with the selected extension.
- See input row count, output row count, and execution duration after successful runs.
- Share the current workspace through the URL.
- Reuse recent commands with arrow-key history navigation.

## Inputs the app accepts

### Client-side user inputs

- Freeform raw text in the textarea.
- Freeform command string in the command input.
- Input format dropdown value.
- Output format dropdown value.
- Preset dropdown value.
- Operation insert clicks from the reference sidebar.
- Copy and download actions.
- Keyboard shortcuts:
  - `Cmd/Ctrl + Enter`
  - `ArrowUp`
  - `ArrowDown`

### URL-derived inputs

- `state` query parameter containing base64url-encoded serialized workspace state.

### Server-side request inputs

- JSON request body fields:
  - `input`
  - `command`
  - `inputFormat`
  - `outputFormat`

### Environment/runtime inputs

- Local executable at `bin/transform-engine` or `bin/transform-engine.exe`
- Optional `ENGINE_BINARY_PATH` during postinstall
- OS platform differences for executable naming and permissions

## Critical user paths

### Primary path

1. Paste data
2. Choose input format
3. Enter command
4. Choose output format
5. Run
6. Read output or error
7. Copy or download result

### Secondary paths

- Load an example preset and immediately run it
- Insert operations from the sidebar to build a chain
- Share the URL and load the same workspace state on another machine
- Reuse earlier commands through keyboard history

## Failure modes that realistically exist

### Client-side failures

- Empty input
- Empty command
- Oversized input
- Overlong command
- Malformed shared URL state
- Clipboard write denial or unsupported clipboard API
- Download failure due to browser restrictions
- Request network failure
- Request aborted mid-flight
- Multiple rapid runs producing out-of-order responses
- Output too large for comfortable rendering
- Browser freezing on very large output preview rendering
- Broken state transitions if multiple state setters diverge
- URL updates growing too large for browser or server limits
- `navigator`, `window`, or `document` access in unsupported contexts

### Server-side failures

- Invalid JSON request body
- Missing or invalid format ids
- Command tokenization failure from unmatched quotes or forbidden characters
- Unsupported operation usage
- Blocked host-access DSL helpers
- Missing engine binary
- Engine timeout
- Engine non-zero exit
- Engine stderr with confusing or internal wording
- Filesystem access error when verifying the engine executable
- Unexpected `execa` failure
- Windows-specific executable or permission issues

### Data-level failures

- Malformed CSV or TSV rows
- Invalid JSON input
- Mixed newline styles
- Empty files with headers only
- No records produced after filtering
- Fields missing from some rows
- Commands referencing absent fields
- Commands valid for one format but surprising for another
- Quoted command expressions containing shell-like characters
- High-cardinality grouping or statistics output

## Edge cases specific to this app

- Shared-state URL present but corrupted or truncated.
- Shared-state URL represents an oversized workspace.
- Input is exactly at the byte limit.
- Command is exactly at the character limit.
- Command has unmatched single quotes.
- Command has unmatched double quotes.
- Command ends with a trailing escape inside double quotes.
- Command contains a forbidden shell character outside quotes.
- Command contains a forbidden character inside a quoted expression and should still work.
- Command is only whitespace.
- Input is only whitespace.
- Output format differs radically from input format, such as JSON array to CSV.
- Output is empty but not an error, such as a filter returning zero rows.
- Very large stdout result that is valid but impractical to render line-by-line.
- Repeated rapid clicks on Run while a request is in flight.
- Running a second request before the first response returns.
- Copy clicked after an error or while output is stale.
- Download clicked on very large output.
- Command history navigation after manual edits.
- History navigation after loading a preset.
- Preset selection after custom workspace edits.
- Operation insertion when the current command already ends with `then`.
- Operation insertion while the app is running.
- Engine executable exists but is not runnable.
- Engine executable path contains spaces.
- Engine emits prefixed error text that leaks internal naming.
- Binary returns stderr plus partial stdout.
- CSV/TSV row count logic becomes inaccurate for quoted embedded newlines.
- JSON row count logic falls back to line count on malformed JSON.
- Long URL state may exceed browser address-bar or proxy limits.

## Performance bottlenecks specific to this stack

- `GridcraftStudio` re-renders the whole interactive surface whenever any local state changes.
- Many event handlers are recreated on every render and passed to children.
- Large output strings are stored in state and then rendered in a single `<pre>`.
- No request cancellation means stale work can continue after it is irrelevant.
- No response-order guard means older requests can overwrite newer results.
- No virtualization means line-heavy output can still be expensive even with preview truncation.
- Suspense fallback is `null`, so route-hydrated content has no visible loading placeholder.
- The operations sidebar renders a sizable static catalog inside the main bundle.
- The route buffers the whole output before returning rather than streaming.
- Shared-state encoding base64s the full input, which can become expensive for large workspaces and inflate history entries.

## Security surfaces specific to this app

### Command execution surface

- The server launches a local executable based on user-provided command text.
- Even with `execa`, command semantics are powerful and need policy enforcement.
- DSL helpers that can touch the host system are a critical surface.
- File-backed operations are a critical surface because the UI only models stdin/stdout.

### Input handling surface

- Raw user input is forwarded to the engine through stdin.
- User-controlled format flags choose parsing and serialization behavior.
- Large payloads can become a CPU or memory denial-of-service vector.
- Malformed commands can try to exploit parser assumptions.

### Browser surface

- Shared workspace state is loaded from the URL and must be treated as untrusted.
- Output is shown as text inside React, so HTML injection risk is currently low as long as `dangerouslySetInnerHTML` is avoided.
- Clipboard and download actions touch browser APIs and should fail safely.

### Server configuration surface

- Missing security headers would reduce browser-side hardening.
- Unstructured error normalization can leak internals or implementation details.
- Missing rate limiting or concurrency limits can allow request flooding.
- Missing abort propagation can leave abandoned work executing on the server.

## Brittle assumptions in the current implementation

- The route assumes all expected user errors can return HTTP 200 with `{ output, error }`.
- The client assumes one in-flight request at a time is sufficient protection against race conditions.
- The row-count logic assumes simple line-based counting for delimited text.
- The shared-state codec assumes browser `btoa` and `atob` availability.
- The preparation script assumes the `bin` directory contains either the correct executable or exactly one fallback file.
- The app assumes the local executable is present after install.
- The app assumes local fonts exist at the bundled paths.
- The app assumes copying and downloading are always client-only actions and never need SSR guards outside the component boundary.

## What production-grade hardening likely requires

- A more explicit request/response contract with typed codes.
- Better server-side schema validation and status-code discipline.
- Response-order protection and request cancellation on the client.
- A more maintainable state model than the current top-level state cluster.
- Better output rendering for very large results.
- Stronger security headers and defensive error sanitization.
- A visible error boundary and better async fallback behavior.
- More comprehensive app-specific edge-case coverage and regression documentation.
