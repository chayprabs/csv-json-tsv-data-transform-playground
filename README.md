# Mill

<div align="center">

**Browser workspace for [Miller](https://miller.readthedocs.io/) (`mlr`) — paste data, run command chains, convert formats, share state by URL.**

[![CI](https://github.com/chayprabs/csv-json-tsv-data-transform-playground/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/chayprabs/csv-json-tsv-data-transform-playground/actions/workflows/ci.yml)

[Features](#what-you-can-do-with-mill) · [Quick start](#quick-start-local) · [Deployment](#deployment) · [Topics](#repository-topics-github-discoverability) · [Product (PRD) scope](#product-scope-prd) · [Architecture](#architecture) · [Configuration](#configuration) · [Security](#security--limits)

</div>

---

## Why Mill exists

Analysts and engineers often need **quick, one-off wrangling** of **CSV**, **TSV**, **JSON**, **NDJSON**, or **DKVP** without spinning up Python, Jupyter, or a spreadsheet. **Mill** is a **server-side** playground: your browser sends structured requests to a **Node.js** app that runs the native **Miller** binary safely (no shell strings, no client-side WASM). It fits the same jobs people search for as **CSV to JSON**, **filter CSV online**, **reshape TSV**, **NDJSON log filter**, **Miller mlr in the browser**, or **awk-style** tabular transforms with reproducible commands.

> **Important:** Mill runs **Miller on the server**. Data leaves the browser for processing. Do not deploy to **static-only** or **edge-only** hosts if you need the transform engine. See [Deployment](#deployment).

---

## What you can do with Mill

| Area | Capability |
|------|------------|
| **Input formats** | **CSV**, **TSV**, **JSON** (array of objects), **NDJSON** / JSON Lines, **DKVP** — chosen explicitly (no auto-detect). |
| **Output formats** | **CSV**, **TSV**, **JSON**, **NDJSON** — **DKVP is input-only** (v1 product rule). |
| **Commands** | Single-line chains with `then` (e.g. `filter '$age > 25' then sort -f name then cut -f name,age`). |
| **Operations** | **23** curated verbs from the product spec (e.g. `cat`, `cut`, `filter`, `sort`, `stats1`, `reshape`, `histogram`, …) with **insert-at-cursor** from the sidebar. |
| **Sharing** | **LZ-string** compressed `?state=` URL (legacy base64 URLs still decode). **Copy link** always reflects the **current** workspace. |
| **Output** | Plain-text preview, **Copy** output, **Download as file** (`output.csv`, `output.json`, …), row counts and timing after runs. |
| **Safety** | Size limits, command length cap, **workspace policy** (blocked file / `tee` patterns), **rate limiting** and **LRU cache** on the API route. |

---

## Quick start (local)

**Requirements:** **Node.js 20+**, **npm**, and a normal desktop OS (macOS, Linux, or Windows) so the bundled **Miller** binary can run.

```bash
git clone https://github.com/chayprabs/csv-json-tsv-data-transform-playground.git
cd csv-json-tsv-data-transform-playground
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:3000`).

- **`npm install`** runs **`postinstall`** → `scripts/prepare-engine.mjs` → copies Miller from **`ENGINE_BINARY_PATH`**, from **`mlr` on your PATH**, or from a single file in `bin/`.
- If the engine is missing, install [Miller](https://miller.readthedocs.io/) (`apt install miller` on Debian/Ubuntu) or set **`ENGINE_BINARY_PATH`**, then run `npm install` again.

**Production-style run:**

```bash
npm run build
npm run start
```

**Quality checks (same as CI):**

```bash
npm run lint
npm audit --audit-level=high
npm run build
```

---

## Deployment

Mill is a **Node 20+** application that **executes a native binary**. Use platforms that allow that (for example **Fly.io**, **Render**, **Railway**, or a **VPS**). **Do not** expect full functionality on **Cloudflare Pages**, **Netlify Edge**, or **Vercel Edge** as the sole runtime for transforms.

At your reverse proxy or load balancer (nginx, Caddy, Traefik, or the platform edge), the product spec suggests **additional** limits on top of the in-app rate limiter: on the order of **100 requests per minute per IP** (all routes), **200 concurrent connections**, and **30 second** connection timeouts.

Read **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** for build steps, smoke checks, and operations details.

---

## Product scope (PRD)

This repository implements the **Mill Product Requirements Document** naming and behaviour:

- **Product name:** **Mill**  
- **Engine:** native **Miller** (`mlr`) as **`bin/transform-engine`**, invoked with **`execa`** and **structured argv** (never `exec` / shell strings).  
- **Stack:** **Next.js** (App Router), **TypeScript**, **Tailwind CSS**.  
- **Execution model:** **`POST /api/run`** — validation, policy, optional cache hit, then engine; responses sanitised for clients.

Key PRD-aligned limits (see code for exact enforcement):

| Item | Typical limit |
|------|-----------------|
| Input size | **10 MB** (with **8 MB** “large / may be slow” warning in the UI) |
| Command length | **1000** characters |
| Engine timeout | **10** seconds |
| Rate limit | **30** requests / **60** s / IP (sliding window on the API route) |
| Result cache | **100** entries, **10** minute TTL (successful runs only) |

---

## Architecture

| Path | Role |
|------|------|
| `app/page.tsx` | Studio entry; restores `?state=` |
| `app/api/run/route.ts` | **Mill** execution API: body gate, Zod validation, rate limit, LRU cache, tokenise, policy, **`execa`** with `env: {}` |
| `middleware.ts` | **CORS** for `/api/run` only (`MILL_ALLOWED_ORIGIN` in production) |
| `components/GridcraftStudio.tsx` | Main UI orchestration (filename kept from the internal layout spec) |
| `components/InputPanel.tsx` | Input, format, byte stats, warnings |
| `components/CommandBar.tsx` | Command, output format, run, shortcuts |
| `components/OutputPanel.tsx` | Output, errors, metrics, copy, download |
| `components/OperationsReference.tsx` | 23-operation catalog |
| `lib/shareState.ts` | LZ-string URL encode/decode + legacy fallback |
| `lib/validation.ts` | Shared limits and **PRD validation copy** |
| `lib/commandPolicy.ts` | Workspace policy before spawn |
| `lib/operations.ts` | Curated **23** operations |
| `lib/apiRateLimit.ts` | Per-IP sliding window |
| `lib/runResponseCache.ts` | SHA-256 keyed LRU cache |
| `scripts/prepare-engine.mjs` | Prepares `bin/transform-engine` after install |

More detail: **[`ARCHITECTURE_NOTES.md`](./ARCHITECTURE_NOTES.md)**.

---

## Configuration

Copy **[`.env.example`](./.env.example)** to `.env.local` when you need non-default settings:

| Variable | When to set |
|----------|----------------|
| `ENGINE_BINARY_PATH` | Custom path to the Miller-compatible binary during **`npm install`**. |
| `MILL_ALLOWED_ORIGIN` | **Production** origin for CORS on **`/api/run`** (exact URL, never `*`). Dev localhost is handled automatically. |

---

## Security & limits

- **CSP**, **nosniff**, **frame deny**, **Referrer-Policy**, **Permissions-Policy** via `next.config.mjs`.
- **No `dangerouslySetInnerHTML`** on engine output — plain text / `<pre>` style rendering.
- **Errors** trimmed and sanitised (no stack traces or host paths to clients).
- **Policy** returns a fixed workspace message for blocked patterns.

---

## Repository topics (GitHub discoverability)

GitHub **Topics** help browsing and search on github.com. In the repo **Settings → General → Topics**, consider adding:

`mill` `miller` `mlr` `csv` `tsv` `json` `ndjson` `dkvp` `data-transformation` `data-wrangling` `etl` `playground` `nextjs` `typescript` `tailwindcss` `server-side` `command-line` `tabular-data` `json-lines`

---

## Common search queries this repo matches

People often look for tools like this using phrases such as:

- Miller **`mlr`** in the browser / **Miller playground**
- **CSV to JSON**, **JSON to CSV**, **TSV** conversion
- **NDJSON** filter, **JSON Lines** transform
- **DKVP** input, **data wrangling** without Excel
- **filter**, **sort**, **cut** on CSV without Python
- **Next.js** + **TypeScript** workspace for **ETL-style** experiments

---

## Contributing & issues

Issues and PRs are welcome. Please run **`npm run lint`** and **`npm run build`** before submitting changes.

---

## Acknowledgements

**Mill** is built around **[Miller](https://github.com/johnkerl/miller)** (**`mlr`**), John Kerl’s excellent record-oriented data tool. Mill adds a **web workspace**, **URL state**, **presets**, and **hosting-oriented guardrails** on top of that engine.

---

<div align="center">

**[↑ Back to top](#mill)**

</div>
