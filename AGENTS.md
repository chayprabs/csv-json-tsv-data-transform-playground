# Gridcraft Studio

## Cursor Cloud specific instructions

### Architecture

Gridcraft Studio is a self-contained Next.js 15 app (single `package.json`, no monorepo). The only service to run is `npm run dev` which starts both the frontend and the `/api/run` backend route.

### Critical runtime dependency: Miller binary

The app delegates all data transformations to a native binary at `bin/transform-engine`, which is a copy of [Miller (`mlr`)](https://miller.readthedocs.io/). Without it, every `/api/run` POST returns HTTP 500. The update script installs Miller via `apt` and runs `npm install` with `ENGINE_BINARY_PATH` set so the postinstall script copies it to the right place.

### Standard commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Production start | `npm run start` |

No test framework is configured in this repository.

### Gotchas

- The `bin/` directory and `bin/transform-engine` are not checked into git — they are created during `npm install` via the `postinstall` script (`scripts/prepare-engine.mjs`). If the binary is missing after install, verify Miller is installed (`which mlr`) and re-run `ENGINE_BINARY_PATH=$(which mlr) npm install`.
- The `bin/` directory is in `.gitignore`, so never commit engine binaries.
- The app has no database, no Docker dependencies, and no external API keys.
