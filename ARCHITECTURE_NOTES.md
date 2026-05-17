# Mill — architecture notes

## Execution

Mill uses a **server-side** execution route. The browser posts structured JSON to `app/api/run/route.ts`. The route validates the body, tokenises the command into argv (never a shell string), applies workspace policy, rate limiting, and LRU caching, then runs `bin/transform-engine` (Miller) via **execa** with `env: {}` and a 10s timeout.

## Components

- `app/layout.tsx` — metadata and shell
- `app/page.tsx` — entry; restores shared state from the URL
- `components/GridcraftStudio.tsx` — input, command, formats, presets, history, URL sync, copy link
- `components/InputPanel.tsx`, `CommandBar.tsx`, `OutputPanel.tsx`, `OperationsReference.tsx`
- `middleware.ts` — CORS for `/api/run` only

## Data flow

1. Load default preset or URL state (`lib/shareState.ts`, LZ-string + legacy base64).
2. User edits input, command, formats; URL updates live.
3. On run: client validation (PRD copy) → `POST /api/run` → engine → optional cached response; metrics from response + client timing.

## Safety

- 10 MB input cap (client + streaming body gate), 1000-character command cap
- Policy blocks `tee`, `--from`, path-like tokens, and host DSL helpers
- Sanitised errors (max 500 chars), `no-store` on dynamic responses
