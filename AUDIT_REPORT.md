# Audit Report

## Phase 1 - Static Analysis And Code Quality

### Baseline findings discovered during the audit

- CRITICAL A1: `npx tsc --noEmit` failed in a clean checkout because `tsconfig.json` depended on generated `.next/types/**/*.ts` files.
- CRITICAL A2: the API route allowed OS command execution through Miller DSL built-ins such as `system()` even though shell metacharacters were filtered.
- CRITICAL A3: after URL-sharing was introduced, the App Router production build failed because `useSearchParams()` was used without a suspense boundary.
- WARNING: `runMiller()` assumed every API response was valid JSON.
- WARNING: client-side validation for empty input, empty commands, and oversized input was missing.
- WARNING: the loading state was incomplete and stale output remained visible during execution.
- WARNING: labels, status regions, and alert semantics were incomplete for key controls.
- WARNING: very large outputs rendered wholesale into a single `<pre>` with no preview cap.

### Verification after fixes

Command run: `npx tsc --noEmit`
Result: PASS

Command run: `npx next lint`
Result during audit: PASS
Operational follow-up: the repo lint script was switched to `eslint . --ext .js,.jsx,.ts,.tsx` so linting no longer mutates `tsconfig.json` and reintroduces the clean-checkout typecheck problem.

Command run: `npm run lint`
Result: PASS

Command run: `npm run build`
Result: PASS

Bundle output:
- `/` - 7.77 kB route size, 95 kB first-load JS
- `/_not-found` - 873 B route size, 88.1 kB first-load JS
- Shared first-load JS - 87.2 kB total
- Largest chunk - 53.6 kB
- No build chunk exceeded 500 kB

Dead-code and hygiene check:
- No `console.` statements remained in shipped `.ts`/`.tsx` files.
- No unused source files or dead components were identified among the reviewed app/component/lib files.
- No commented-out source blocks longer than five lines remained.

Security verification:
- API execution uses `execa` with a fixed binary path and an argument array.
- Input is limited to 10 MB and commands are limited to 1000 characters.
- Subprocess timeout remains 10 seconds.
- User-correctable failures return structured `{ output, error }` payloads with HTTP 200.
- Miller DSL functions with host access such as `system()`, `exec()`, and `stat()` are blocked.
- Unsupported file-backed/side-effect verbs such as `join`, `split`, `tee`, and `template` are blocked with explicit messages.
- `put -f` and `filter -f` are blocked because they load server-side DSL files.

Error handling verification:
- Client-side validation now stops empty input, empty command, and oversized input before requests are sent.
- `runMiller()` now handles malformed or non-JSON responses defensively.
- Output is cleared at run start and visible errors always render in the output panel.
- Loading state now disables the full execution surface, including the command bar and verb sidebar.

Accessibility verification:
- The textarea, preset selector, input format selector, output format selector, and command input now have programmatic labels.
- Output errors use `role="alert"`.
- Output status uses an `aria-live="polite"` region.
- Keyboard navigation remains available for Cmd/Ctrl+Enter and command-history traversal.

Performance verification:
- Very large output is preview-capped while full output remains available for copy/download.
- The collapsed sidebar keeps rendering minimal content.
- Sidebar interactions are disabled while a run is in flight.

### 1.9 Missing Features Audit After Fixes

- PRESENT: CSV input -> selector exists and works
- PRESENT: TSV input -> selector exists and works
- PRESENT: JSON input -> selector exists and works
- PRESENT: NDJSON input -> selector exists and works
- PRESENT: Output format selector distinct from input format selector
- PRESENT: At least 5 preset examples
- PRESENT: Verb reference sidebar with clickable verbs
- PRESENT: Copy to clipboard button on output
- PRESENT: Download button on output
- PRESENT: Cmd/Ctrl + Enter keyboard shortcut
- PRESENT: Error display in red when mlr fails
- PRESENT: Empty input validation
- PRESENT: Load example button

## Phase 2 / Phase 5 - Functional Testing Final Verification

All tests were run against `http://127.0.0.1:3000/api/run` while `npm run dev -- --hostname 127.0.0.1 --port 3000` was active.

TEST_01: PASS
Status: 200
Output: `name,age Alice,32 Bob,28`
Error: `null`
Notes: Duration: 723ms.

TEST_02: PASS
Status: 200
Output: `name,salary Alice,95000 Bob,72000`
Error: `null`
Notes: Duration: 32ms.

TEST_03: PASS
Status: 200
Output: `name,age Alice,32 Carol,35`
Error: `null`
Notes: Duration: 34ms.

TEST_04: PASS
Status: 200
Output: `name,age Alice,32 Bob,28 Carol,35`
Error: `null`
Notes: Duration: 27ms.

TEST_05: PASS
Status: 200
Output: `dept,salary_mean,salary_min,salary_max Eng,100000,95000,105000 Mkt,70000,68000,72000`
Error: `null`
Notes: Duration: 29ms.

TEST_06: PASS
Status: 200
Output: `[ { "name": "Alice", "age": 32 }, { "name": "Bob", "age": 28 } ]`
Error: `null`
Notes: Duration: 27ms.

TEST_07: PASS
Status: 200
Output: `name,age Alice,32 Bob,28`
Error: `null`
Notes: Duration: 28ms.

TEST_08: PASS
Status: 200
Output: `name,years Alice,32`
Error: `null`
Notes: Duration: 29ms.

TEST_09: PASS
Status: 200
Output: `name,age,dept Carol,35,Eng Alice,32,Eng`
Error: `null`
Notes: Duration: 28ms.

TEST_10: PASS
Status: 200
Output: `name Alice Bob`
Error: `null`
Notes: Duration: 28ms.

TEST_11: PASS
Status: 200
Output: ``
Error: `Please paste some data first.`
Notes: Duration: 6ms.

TEST_12: PASS
Status: 200
Output: ``
Error: `mlr: verb "notaverb" not found. Please use "mlr -l" for a list.`
Notes: Duration: 26ms.

TEST_13: PASS
Status: 200
Output: ``
Error: `mlr: CSV header/data length mismatch 2 != 1 at filename (stdin) row 2`
Notes: Duration: 26ms.

TEST_14: PASS
Status: 200
Output: `score_mean 49.995`
Error: `null`
Notes: Duration: 34ms.

TEST_15: PASS
Status: 200
Output: ``
Error: `Unsupported shell-style character ";" found outside quotes.`
Notes: Marker path uses `os.tmpdir()` on Windows; semicolon injection remained blocked. Duration: 4ms.

SEC_01: PASS
Status: 200
Output: ``
Error: `This playground blocks Miller DSL functions that can access the host system, such as system(), exec(), and stat().`
Notes: Regression check for the previously exploitable `system()/exec()/stat()` path.