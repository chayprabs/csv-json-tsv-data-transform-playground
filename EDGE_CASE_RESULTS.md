# Edge Case Results

## Summary

- Total edge cases exercised: `60`
- Passing gracefully: `60`
- Failing after fixes: `0`

## Data / Format / Size Cases

| ID | Edge Case | Actual | Result |
|---|---|---|---|
| EDGE_EMPTY_INPUT | Empty input | Client/server validation blocked run with exact message | PASS |
| EDGE_EMPTY_COMMAND | Empty command | Client/server validation blocked run with exact message | PASS |
| EDGE_WHITESPACE_COMMAND | Whitespace command | Blocked with exact message | PASS |
| EDGE_HEADER_ONLY | Header row only | API returned 200 without crash | PASS |
| EDGE_ONE_ROW | Single row input | API returned correct output | PASS |
| EDGE_ONE_COLUMN | Single column input | API returned correct output | PASS |
| EDGE_500_COLUMNS | 500-column row | API returned 200 | PASS |
| EDGE_1000_COLUMNS | 1000-column row | API returned 200 | PASS |
| EDGE_LONG_HEADERS | 220-char header name | API returned 200 | PASS |
| EDGE_HEADER_SPACES | Column names with spaces | API returned 200 | PASS |
| EDGE_HEADER_SPECIAL_CHARS | Column names with `$ # @ . [] {}` | API returned 200 | PASS |
| EDGE_NUMERIC_HEADERS | Numeric column names | API returned 200 | PASS |
| EDGE_DUPLICATE_HEADERS | Duplicate column names | Handled without 500 | PASS |
| EDGE_UNICODE | Arabic / CJK / emoji payload | API returned 200 | PASS |
| EDGE_QUOTED_COMMA | CSV comma inside quotes | Preserved correctly | PASS |
| EDGE_QUOTED_NEWLINE | CSV newline inside quotes | Preserved correctly | PASS |
| EDGE_CRLF | Windows line endings | Parsed correctly | PASS |
| EDGE_MIXED_LINE_ENDINGS | Mixed LF / CRLF | Parsed correctly | PASS |
| EDGE_BOM | UTF-8 BOM | Parsed correctly | PASS |
| EDGE_NULL_JSON | JSON null values | Returned 200 | PASS |
| EDGE_UNDEFINED_JSON | Mixed object/null array | Handled without 500 | PASS |
| EDGE_DEEPLY_NESTED_JSON | Nested JSON objects | Returned 200 | PASS |
| EDGE_MIXED_JSON_ARRAY | JSON array of mixed types | Handled without 500 | PASS |
| EDGE_STRING_NUMBERS | Numeric-looking strings | Returned 200 | PASS |
| EDGE_BIG_INT | `> Number.MAX_SAFE_INTEGER` | Returned 200 | PASS |
| EDGE_SCI_NOTATION | Scientific notation | Returned 200 | PASS |
| EDGE_NEGATIVE_NUMBER | Negative number | Returned 200 | PASS |
| EDGE_BOOLEAN_CSV | `true/false` in CSV | Returned 200 | PASS |
| EDGE_DATES | Multiple date formats | Returned 200 | PASS |
| EDGE_WHITESPACE_VALUES | All-whitespace values with `fill-empty` | Returned 200 | PASS |
| EDGE_VALID_JSON_OBJECT | Valid JSON object instead of array | Returned 200 | PASS |
| EDGE_JSON_AS_CSV | JSON pasted as CSV | Rejected gracefully, no 500 | PASS |
| EDGE_CSV_AS_JSON | CSV pasted as JSON | Rejected gracefully, no 500 | PASS |
| EDGE_ONE_BYTE_INPUT | 1-byte input | Handled without 500 | PASS |
| EDGE_1MB_INPUT | ~1 MB input | Returned 200 | PASS |
| EDGE_1M_ROWS | 1 million minimal rows with `head -n 1` | Returned 200 without crash | PASS |
| EDGE_LONG_COMMAND | 2001-char command | Blocked with exact message | PASS |

## Command / Semantics Cases

| ID | Edge Case | Actual | Result |
|---|---|---|---|
| EDGE_UNKNOWN_VERB | Unknown operation | 422 with sanitized “Unknown operation …” | PASS |
| EDGE_WRONG_FLAG | Valid verb, wrong flag | 422 with sanitized error, no paths | PASS |
| EDGE_NONEXISTENT_FIELD_CUT | `cut` missing field | Returned 200 without crash | PASS |
| EDGE_NONEXISTENT_FIELD_FILTER | `filter` missing field | Returned 200 without crash | PASS |
| EDGE_MALFORMED_FILTER | `filter '$a >'` | 422 with sanitized parse error | PASS |
| EDGE_DOUBLE_DOLLAR | `filter '$$a'` | 422, graceful failure | PASS |
| EDGE_SPECIAL_CHAR_COMMAND | `cat | sort` | Blocked before execution | PASS |
| EDGE_ZERO_ROWS | Command returns no rows | 200 with zero-row UI handling | PASS |
| EDGE_MORE_ROWS_THAN_INPUT | `reshape` expands row count | Returned expanded output correctly | PASS |

## UI / Browser Cases

| ID | Edge Case | Actual | Result |
|---|---|---|---|
| UI_LOADING_STATE | Slow response / in-flight run | Input, command, and run button disabled; output shows “Running transformation...” | PASS |
| UI_RAPID_REPEAT_RUN | Run clicked then shortcut pressed during in-flight request | Only one request sent | PASS |
| UI_CLIENT_EMPTY_INPUT | Run with empty input | Visible inline error; no network request | PASS |
| UI_CLIENT_EMPTY_COMMAND | Run with empty command | Visible inline error; no network request | PASS |
| UI_CLIENT_LONG_COMMAND | Overlong command in browser | Visible inline error; no network request | PASS |
| UI_CLIENT_OVERSIZE_INPUT | `>10 MB` input in browser | Visible inline error; no network request | PASS |
| UI_OUTPUT_SHORTCUT | `Ctrl+Enter` while output panel focused | Run succeeded | PASS |
| UI_ZERO_ROWS_HEADER | Zero-row CSV result | Visible “0 rows” message plus header row retained | PASS |
| UI_HISTORY | Arrow up/down history after multiple runs | Previous command restored and draft returned | PASS |
| UI_MALFORMED_URL | Corrupt `?state=` param | App loaded default workspace without crash | PASS |
| UI_UNDO | `Ctrl+Z` in input textarea | Native undo restored prior value | PASS |
| UI_NAVIGATE_AWAY | Navigate away during delayed run | No page crash; request did not break the app shell | PASS |
| UI_RESPONSIVE_320 | 320px width | Usable, no horizontal scroll | PASS |
| UI_RESPONSIVE_375 | 375px width | Usable, no horizontal scroll | PASS |
| UI_RESPONSIVE_768 | 768px width | Usable, no horizontal scroll | PASS |
| UI_RESPONSIVE_1440 | 1440px width | Usable, no horizontal scroll | PASS |
| UI_RESPONSIVE_3840 | 4K width | Usable, no horizontal scroll | PASS |
| UI_DOWNLOAD_EXTENSIONS | CSV/JSON/TSV/NDJSON downloads | Correct timestamped extensions for all tested formats | PASS |
| UI_URL_RESTORE | Shared URL opened in new tab | Input/command/formats restored exactly | PASS |

## Notes

- Clipboard copy was verified in Chromium via Playwright and produced the full output payload.
- Browser cross-compatibility was exercised in local Chrome only; no Safari/Firefox automation was run in this environment.
