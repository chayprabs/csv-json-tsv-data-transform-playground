# Edge Case Results

## EC_001

- Description: Empty input with valid command
- Status: PASS
- HTTP status: 400
- Output: ``
- Error: `Please paste some data first.`

## EC_002

- Description: Empty command with valid input
- Status: PASS
- HTTP status: 400
- Output: ``
- Error: `Please enter a transformation command.`

## EC_003

- Description: Input over 10 MB limit
- Status: PASS
- HTTP status: 413
- Output: ``
- Error: `Input is too large. The current limit is 10 MB.`

## EC_004

- Description: Command over 1000 characters
- Status: PASS
- HTTP status: 400
- Output: ``
- Error: `Command is too long. Please keep it under 1000 characters.`

## EC_005

- Description: Unmatched quote in command
- Status: PASS
- HTTP status: 422
- Output: ``
- Error: `Command contains an unmatched quote.`

## EC_006

- Description: Forbidden shell character outside quotes
- Status: PASS
- HTTP status: 422
- Output: ``
- Error: `Unsupported shell-style character ";" found outside quotes.`

## EC_007

- Description: Semicolon inside quoted expression
- Status: PASS
- HTTP status: 200
- Output: `note
safe;value
safe;value
`
- Error: ``

## EC_008

- Description: Unsupported file-backed operation
- Status: PASS
- HTTP status: 403
- Output: ``
- Error: `This operation requires additional server-side files, which this workspace does not expose.`

## EC_009

- Description: Blocked host-access DSL helper
- Status: PASS
- HTTP status: 403
- Output: ``
- Error: `This workspace blocks DSL functions that can access the host system, such as system(), exec(), and stat().`

## EC_010

- Description: Unsupported format id
- Status: PASS
- HTTP status: 400
- Output: ``
- Error: `Request body must include text input, command, and supported formats.`

## EC_011

- Description: Malformed CSV with missing field
- Status: PASS
- HTTP status: 422
- Output: ``
- Error: `CSV header/data length mismatch 2 != 1 at input row 2`

## EC_012

- Description: Invalid JSON input
- Status: PASS
- HTTP status: 422
- Output: ``
- Error: `invalid character ']' looking for beginning of object key string`

## EC_013

- Description: Valid command with zero matching rows
- Status: PASS
- HTTP status: 200
- Output: ``
- Error: ``

## EC_014

- Description: Quoted commas inside CSV fields
- Status: PASS
- HTTP status: 200
- Output: `name,notes
Alice,"hello, world"
Bob,"x, y"
`
- Error: ``

## EC_015

- Description: CRLF-delimited CSV input
- Status: PASS
- HTTP status: 200
- Output: `name,age
Alice,32
Bob,28
`
- Error: ``

## EC_016

- Description: Large 10000-row aggregation
- Status: PASS
- HTTP status: 200
- Output: `score_mean
49.995
`
- Error: ``

## EC_017

- Description: Corrupted shared-state query parameter
- Status: PASS
- HTTP status: 200
- Output: `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1775409`
- Error: ``

## EC_018

- Description: Missing engine executable
- Status: PASS
- HTTP status: 500
- Output: ``
- Error: `The transformation engine is unavailable on the server.`

## EC_019

- Description: Concurrent API requests
- Status: PASS
- HTTP status: 200
- Output: `A=name,age
Alice,32
 || B=name
Carol
Dave
`
- Error: ``

## EC_020

- Description: Invalid JSON request body
- Status: PASS
- HTTP status: 400
- Output: ``
- Error: `Request body must be valid JSON.`

