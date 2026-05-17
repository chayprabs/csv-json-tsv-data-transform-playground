# Mill

Mill is a browser-based data transformation workspace backed by **Miller (mlr)**. Paste tabular or record-based input, run command chains with `then`, choose input and output formats, and share the full workspace through the URL (LZ-compressed state).

## Features

- Paste and transform **CSV**, **TSV**, **JSON**, **NDJSON**, and **DKVP** input (formats are explicit; no auto-detect)
- Output formats: **CSV**, **TSV**, **JSON**, **NDJSON** (DKVP is input-only in v1)
- Server-side execution via native `bin/transform-engine` — **not** edge/static-only
- Chained commands, 23-operation reference sidebar with insert-at-cursor
- Presets, command history (session), copy output, **Copy link**, download as `output.{ext}`
- Row counts, client-side round-trip timing, URL state sync, rate limit and LRU cache on the API route

## Run locally

1. `npm install` — runs `postinstall` → `scripts/prepare-engine.mjs` → `bin/transform-engine`
2. `npm run dev` — open the URL Next prints
3. `npm run build` / `npm run start` for production

Optional: set `ENGINE_BINARY_PATH` before `npm install` to use a custom Miller binary. For CORS in production, set `MILL_ALLOWED_ORIGIN` (see `.env.example` and `DEPLOYMENT.md`).

## Workspace layout

- `app/page.tsx` — studio entry, restores `?state=` from URL
- `app/api/run/route.ts` — validation, policy, rate limit, LRU cache, execa
- `components/GridcraftStudio.tsx` — orchestration (PRD file name retained)
- `lib/shareState.ts` — LZ-string URL state + legacy base64 fallback
- `lib/operations.ts` — 23 PRD operations
- `middleware.ts` — CORS for `/api/run` only

## Deployment

See **`DEPLOYMENT.md`** for Node host requirements, proxy limits, and smoke tests.
