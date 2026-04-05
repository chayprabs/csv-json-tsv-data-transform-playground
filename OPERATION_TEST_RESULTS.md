# Operation Test Results

## Summary

- Format matrix: `14/14` passing
- Core operation tests: `18/18` passing
- Chaining tests: `3/3` passing
- Performance tests: `5/5` passing

Prompt note: the instructions say “13 combinations” but enumerate 14 format pairs. All 14 enumerated pairs were executed.

## Format Matrix

| Test ID | Input | Command | Format In | Format Out | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| FORMAT_01 | Base dataset | `cat` | CSV | CSV | 5 rows, valid CSV | 5 rows, valid CSV | PASS |
| FORMAT_02 | Base dataset | `cat` | CSV | JSON | 5 records, valid JSON array | 5 records, valid JSON array | PASS |
| FORMAT_03 | Base dataset | `cat` | CSV | NDJSON | 5 JSON lines | 5 JSON lines | PASS |
| FORMAT_04 | Base dataset | `cat` | CSV | TSV | 5 rows, valid TSV | 5 rows, valid TSV | PASS |
| FORMAT_05 | Base dataset | `cat` | JSON | CSV | 5 rows, valid CSV | 5 rows, valid CSV | PASS |
| FORMAT_06 | Base dataset | `cat` | JSON | JSON | 5 records, valid JSON array | 5 records, valid JSON array | PASS |
| FORMAT_07 | Base dataset | `cat` | JSON | NDJSON | 5 JSON lines | 5 JSON lines | PASS |
| FORMAT_08 | Base dataset | `cat` | JSON | TSV | 5 rows, valid TSV | 5 rows, valid TSV | PASS |
| FORMAT_09 | Base dataset | `cat` | NDJSON | CSV | 5 rows, valid CSV | 5 rows, valid CSV | PASS |
| FORMAT_10 | Base dataset | `cat` | NDJSON | JSON | 5 records, valid JSON array | 5 records, valid JSON array | PASS |
| FORMAT_11 | Base dataset | `cat` | NDJSON | TSV | 5 rows, valid TSV | 5 rows, valid TSV | PASS |
| FORMAT_12 | Base dataset | `cat` | TSV | CSV | 5 rows, valid CSV | 5 rows, valid CSV | PASS |
| FORMAT_13 | Base dataset | `cat` | TSV | JSON | 5 records, valid JSON array | 5 records, valid JSON array | PASS |
| FORMAT_14 | Base dataset | `cat` | TSV | NDJSON | 5 JSON lines | 5 JSON lines | PASS |

## Core Operations

| Test ID | Input | Command | Format In | Format Out | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| TEST_OP_01 | Base CSV | `cut -f name,score` | CSV | CSV | `name,score` only | `name,score` only | PASS |
| TEST_OP_02 | Base CSV | `filter '$age > 30'` | CSV | CSV | Alice, Carol, Dave only | Alice, Carol, Dave only | PASS |
| TEST_OP_03 | Base CSV | `filter '$city == "London"'` | CSV | CSV | Alice only | Alice only | PASS |
| TEST_OP_04 | Base CSV | `sort -f name` | CSV | CSV | Alphabetical by name | Alphabetical by name | PASS |
| TEST_OP_05 | Base CSV | `sort -nr score` | CSV | CSV | Descending numeric score | Carol, Alice, Eve, Bob, Dave | PASS |
| TEST_OP_06 | Base CSV | `rename score,rating` | CSV | CSV | Header renamed to `rating` | Header renamed to `rating` | PASS |
| TEST_OP_07 | Base CSV | `stats1 -a mean -f score` | CSV | CSV | `score_mean = 79` | `score_mean = 79` | PASS |
| TEST_OP_08 | Base CSV | `stats1 -a mean,min,max -f score -g city` | CSV | CSV | 1 row per city with aggregates | Correct grouped rows | PASS |
| TEST_OP_09 | Base CSV | `count-distinct -f city` | CSV | CSV | 5 rows, count 1 each | 5 rows, count 1 each | PASS |
| TEST_OP_10 | Base CSV | `head -n 3` | CSV | CSV | First 3 rows | Alice, Bob, Carol | PASS |
| TEST_OP_11 | Base CSV | `tail -n 2` | CSV | CSV | Last 2 rows | Dave, Eve | PASS |
| TEST_OP_12 | Base CSV | `reorder -f score,name,age,city` | CSV | CSV | Column order preserved exactly | Correct order | PASS |
| TEST_OP_13 | Base CSV | `filter '$age > 28' then sort -nr score then cut -f name,score` | CSV | CSV | Carol, Alice, Eve, Dave | Correct chain output | PASS |
| TEST_OP_14 | Duplicate-name CSV | `uniq -f name` | CSV | CSV | Keep one full row per name | One full row per name | PASS |
| TEST_OP_15 | Base CSV | `put '$score_doubled = $score * 2'` | CSV | CSV | New computed field | `score_doubled` added correctly | PASS |
| TEST_OP_16 | Base CSV | `label fullname,years,location,points` | CSV | CSV | All 4 headers renamed | Correct labels | PASS |
| TEST_OP_17 | Sparse CSV | `fill-empty -v N/A` | CSV | CSV | Empty cells replaced | Empty cells replaced | PASS |
| TEST_OP_18 | Base CSV | `format-values -f %.2f -k score` | CSV | CSV | Score formatted to 2 decimals | Score formatted to 2 decimals | PASS |

## Chaining

| Test ID | Input | Command | Format In | Format Out | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| TEST_CHAIN_01 | Base CSV | `filter '$score > 70' then sort -nr score then cut -f name,city,score` | CSV | CSV | 4 matching rows, sorted | Correct output | PASS |
| TEST_CHAIN_02 | Base CSV | `filter '$age < 40' then rename score,rating then sort -f city then cut -f name,city,rating` | CSV | CSV | 4 matching rows, renamed/sorted | Correct output | PASS |
| TEST_CHAIN_03 | Base CSV | `stats1 -a mean -f score -g city then filter '$score_mean > 75'` | CSV | CSV | Grouped stats filtered over 75 | Correct output | PASS |

## Performance

| Test ID | Input | Command | Format In | Format Out | Expected | Actual | Result |
|---|---|---|---|---|---|---|---|
| TEST_PERF_01 | 10k synthetic CSV | `filter '$score > 50'` | CSV | CSV | `<1000ms` | `210ms` | PASS |
| TEST_PERF_02 | 10k synthetic CSV | `stats1 -a mean,min,max,sum -f salary -g dept` | CSV | CSV | `<2000ms` | `101ms` | PASS |
| TEST_PERF_03 | 10k synthetic CSV | `sort -nr salary then cut -f name,dept,salary` | CSV | CSV | `<2000ms` | `166ms` | PASS |
| TEST_PERF_04 | 100k synthetic CSV | `filter '$active == "true"'` | CSV | CSV | `<10000ms` | `410ms` | PASS |
| TEST_PERF_05 | 100k synthetic CSV | `stats1 -a mean -f salary -g dept` | CSV | CSV | `<15000ms` | `437ms` | PASS |
