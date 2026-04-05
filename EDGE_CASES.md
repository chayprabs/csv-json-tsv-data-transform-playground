# Edge Cases

## EC_001

- Description: Empty input with a valid command.
- Why it matters: The client and route both need to reject a blank workspace clearly instead of handing confusing parser errors to the user.
- How to test it: POST `/api/run` with `input: ""`, `command: "cat"`, `inputFormat: "csv"`, `outputFormat: "csv"`.
- Expected behavior: Structured response with a descriptive validation error and no server crash.

## EC_002

- Description: Non-empty input with an empty command.
- Why it matters: The app should stop before execution when no operation chain is present.
- How to test it: POST `/api/run` with CSV input and `command: ""`.
- Expected behavior: Structured response with a descriptive validation error and no server crash.

## EC_003

- Description: Input payload just over the 10 MB server limit.
- Why it matters: This app accepts arbitrary pasted text, so size-based denial-of-service protection is a core guardrail.
- How to test it: Generate a string slightly above 10 MB and POST it with `command: "cat"`.
- Expected behavior: Structured size-limit error without invoking the engine.

## EC_004

- Description: Command longer than the 1000-character limit.
- Why it matters: Extremely long command strings can stress parsing, logging, and the execution layer.
- How to test it: POST a valid input with a `command` string longer than 1000 characters.
- Expected behavior: Structured command-length error without invoking the engine.

## EC_005

- Description: Command with an unmatched quote.
- Why it matters: Freeform command entry must fail predictably on incomplete quoting.
- How to test it: POST `command: "filter '$age > 30"` with valid CSV input.
- Expected behavior: Structured parse error explaining that the quote is unmatched.

## EC_006

- Description: Command injection attempt using a forbidden shell-style character outside quotes.
- Why it matters: The route launches a local executable, so metacharacter rejection is a critical security barrier.
- How to test it: POST `command: "cat; whoami"`.
- Expected behavior: Structured parse error rejecting the semicolon before the engine runs.

## EC_007

- Description: Semicolon inside a quoted expression.
- Why it matters: The tokenizer must reject shell-style syntax outside quotes without breaking legitimate quoted expressions.
- How to test it: POST `command: "put '$note = \"safe;value\"' then cut -f note"` with simple CSV input.
- Expected behavior: Successful output containing `safe;value`.

## EC_008

- Description: File-backed or side-output operation invocation.
- Why it matters: The UI models one stdin-style input and one stdout-style output, so file-dependent operations must be blocked explicitly.
- How to test it: POST `command: "join -j id -f lookup.csv"`.
- Expected behavior: Structured policy error explaining that the operation is not available in this workspace.

## EC_009

- Description: Host-access DSL helper invocation.
- Why it matters: The embedded transformation language exposes helpers that can reach the host system unless blocked.
- How to test it: POST `command: "put '$x = system(\"echo unsafe\")'"`.
- Expected behavior: Structured policy error before execution begins.

## EC_010

- Description: Unsupported format id.
- Why it matters: The route should reject unexpected format values safely even if the client UI never sends them.
- How to test it: POST `inputFormat: "yaml"` with otherwise valid payload.
- Expected behavior: Structured unsupported-format error and no server crash.

## EC_011

- Description: Malformed CSV with a missing field on one row.
- Why it matters: Real pasted data is often dirty; parser failures must surface clearly.
- How to test it: POST `input: "name,age\nAlice\nBob,28"`, `command: "cat"`.
- Expected behavior: Structured parser error or graceful engine output, but no server crash.

## EC_012

- Description: Invalid JSON input.
- Why it matters: Users can select JSON format and paste malformed content, so the failure mode must stay readable.
- How to test it: POST malformed JSON with `inputFormat: "json"`, `command: "cat"`.
- Expected behavior: Structured parser error and no server crash.

## EC_013

- Description: A valid command that produces zero matching rows.
- Why it matters: Empty results are a successful outcome and should not be confused with failures.
- How to test it: POST `command: "filter '$age > 100'"` against a small CSV dataset.
- Expected behavior: Successful response, no error, and empty or header-only output depending on engine behavior.

## EC_014

- Description: CSV with quoted commas inside fields.
- Why it matters: Structured text often contains commas inside quoted fields, and pass-through conversion must preserve them.
- How to test it: POST `input: "name,notes\nAlice,\"hello, world\"\nBob,\"x, y\""`, `command: "cat"`.
- Expected behavior: Successful output preserving quoted field values.

## EC_015

- Description: CRLF-delimited input.
- Why it matters: Users paste data from Windows tools, email, and spreadsheets that often use `\r\n`.
- How to test it: POST CSV input with `\r\n` line endings and `command: "cat"`.
- Expected behavior: Successful output with the expected records.

## EC_016

- Description: Large but valid 10,000-row aggregation.
- Why it matters: The app’s core promise is interactive transformation, so medium-large inputs must stay within timeout and memory limits.
- How to test it: Generate 10,000 CSV rows and POST `command: "stats1 -a mean -f score"`.
- Expected behavior: Successful aggregated output within the configured timeout.

## EC_017

- Description: Corrupted share-state query parameter.
- Why it matters: Shared URLs are user-facing and untrusted; the app shell must still load even if the encoded state is invalid.
- How to test it: Request `/?state=%25%25%25not-valid`.
- Expected behavior: Page responds successfully and the app shell still renders.

## EC_018

- Description: Engine executable missing at request time.
- Why it matters: Local setup drift and deployment mistakes are realistic, and the route should fail clearly rather than crashing hard.
- How to test it: Temporarily rename the engine executable, POST a normal request, then restore it.
- Expected behavior: Structured server error indicating the executable is missing.

## EC_019

- Description: Concurrent API requests.
- Why it matters: Multiple browser tabs or quick repeat submissions can hit the route at once, so the server should handle them independently without shared-state corruption.
- How to test it: Fire two POST requests in parallel with different commands.
- Expected behavior: Both requests complete with the correct independent results.

## EC_020

- Description: Invalid JSON request body.
- Why it matters: The route is public to the app and should handle malformed bodies safely.
- How to test it: POST a non-JSON body with `Content-Type: application/json`.
- Expected behavior: Structured error explaining that the body must be valid JSON.
