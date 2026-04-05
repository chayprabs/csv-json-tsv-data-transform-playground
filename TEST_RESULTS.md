# Verification Results

All required checks were run against the local development server at `http://127.0.0.1:3000`.

## Format checks

- PASS: CSV input -> CSV output returned the original rows unchanged
- PASS: CSV input -> JSON output returned a JSON array of records
- PASS: JSON input -> CSV output returned CSV with the expected header and rows
- PASS: NDJSON input -> CSV output returned CSV with the expected rows
- PASS: TSV input -> TSV output preserved tab delimiters

## Operation checks

- PASS: `cut -f name,salary`
- PASS: `filter '$age > 30'`
- PASS: `sort -f dept`
- PASS: `sort -nr salary`
- PASS: `rename salary,compensation`
- PASS: `stats1 -a mean,min,max -f salary -g dept`
- PASS: `count-distinct -f dept`
- PASS: `uniq -f age`
- PASS: `head -n 2`
- PASS: `tail -n 2`

## Edge-case checks

- PASS: Empty input shows a clear validation error
- PASS: Invalid commands surface a readable unknown-operation message
- PASS: Large input completed successfully on a multi-thousand-row dataset
- PASS: Malformed CSV returned a structured parsing error without crashing the app
- PASS: Chained commands returned correctly filtered and sorted output

## Preset checks

- PASS: Filter rows where value > threshold
- PASS: Rename and reorder columns
- PASS: CSV to JSON conversion
- PASS: Compute column statistics
- PASS: Pivot / reshape wide to long
- PASS: Deduplicate rows

## UI checks

- PASS: Copy button copied output to the clipboard
- PASS: Download button saved a file with the correct extension
- PASS: `Cmd/Ctrl + Enter` triggered execution
- PASS: Clicking a reference entry inserted starter syntax into the command bar
- PASS: The operations reference opened and closed correctly
