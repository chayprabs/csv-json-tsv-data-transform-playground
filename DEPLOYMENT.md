# Mill — deployment runbook

Mill is a **Node.js 20+** application. It **must** run where the native Miller binary (`bin/transform-engine`) can execute. Do **not** deploy to static-only or edge-only hosts (for example Cloudflare Pages, Netlify Edge, or Vercel Edge Functions) without replacing the execution model.

## Build and run

```bash
npm install   # runs postinstall → prepares bin/transform-engine
npm run build
npm run start
```

Confirm `bin/transform-engine` exists and is executable after install.

## Security and limits (application)

- Request body is limited before JSON parse; commands are tokenised (no shell strings); workspace policy blocks unsafe patterns.
- In-process rate limiting: 30 requests per IP per 60 seconds on `POST /api/run` (see `lib/apiRateLimit.ts`).
- LRU cache: up to 100 successful identical requests for 10 minutes (see `lib/runResponseCache.ts`).
- Set `MILL_ALLOWED_ORIGIN` to your public site origin so CORS on `/api/run` is not wildcarded.

## Infrastructure (reverse proxy)

At the reverse proxy or platform edge, the PRD recommends additionally:

- **100** requests per minute per IP across all routes.
- **200** concurrent connections maximum.
- **30** second connection timeout.

Configure these in nginx, Caddy, Traefik, Fly.io `[[services.http_checks]]`, Render/Railway dashboards, or your cloud load balancer as appropriate.

## Automated smoke tests

With the production server running (`npm run start`):

```bash
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
```

This runs PRD §18 API checks (validation, policy block, 413, rate limit, and a transform when the engine is available).

## Smoke checks after deploy

1. Load `/` — default preset appears.
2. Run `filter '$age > 0'` on the sample CSV — output rows and timing show.
3. Rapid repeated `POST /api/run` — expect **429** with `Too many requests. Please wait a moment.` after the limit.
4. `POST /api/run` with a body over 10 MB — **413**.
5. Command containing an obvious file path — **400** with `This operation is not available in the workspace.`
6. Open a copied URL — input, command, and both formats restore.

## CI

The repository workflow runs `npm ci`, `npm run lint`, `npm audit --audit-level=high`, and `npm run build`.
