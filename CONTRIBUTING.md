# Contributing to Mill

Thank you for helping improve Mill.

## Development setup

1. **Node.js 20+** (see `.nvmrc`)
2. `npm ci`
3. Install Miller and copy to `bin/transform-engine` (see [README](./README.md#quick-start-local))
4. `npm run dev` — open http://localhost:3000

## Before opening a PR

```bash
npm run lint
npm audit --audit-level=high
npm run build
# With Miller installed:
npm run start &
SMOKE_REQUIRE_ENGINE=1 npm run smoke
```

## Scope

- Keep changes focused on the Mill PRD (server-side `mlr` workspace, safety limits, URL sharing).
- Do not weaken command policy or error sanitisation without discussion.
- Match existing TypeScript and Tailwind patterns.

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).
