# Audit

## Static Checks

- `npx tsc --noEmit`: pass
- `npx next lint`: pass (`next lint` deprecation notice only)
- `npm run build`: pass

## Security Scan Summary

- `execa` usage in [`app/api/run/route.ts`](/Users/chait/authos/t2/miller-web/app/api/run/route.ts) is safe: no shell string, argument array only, stdin piping only, timeout + abort wired.
- `process.env` usage is limited to build-time config (`NODE_ENV`, `ANALYZE`) and install-time engine bootstrap (`ENGINE_BINARY_PATH`).
- No `dangerouslySetInnerHTML`, `eval`, or raw shell execution paths exist in app runtime code.
- No secrets or hard-coded credentials were found in app source.

## Findings

| Severity | File | Line | Description | Status |
|---|---|---:|---|---|
| HIGH | `lib/validation.ts` | 2 | Client/server validation contract used a 1000-char command limit and non-spec messages, which broke the mandatory UX contract. | Fixed |
| HIGH | `components/GridcraftStudio.tsx` | 320 | `Cmd/Ctrl+Enter` was only wired to the command input, so the shortcut failed when focus was in the output panel or elsewhere in the workspace. | Fixed |
| HIGH | `components/OutputPanel.tsx` | 52 | Loading/empty-result output states were incomplete: running text was generic, zero-row results rendered as a blank panel, and header rows were lost on empty CSV/TSV output. | Fixed |
| HIGH | `components/GridcraftStudio.tsx` | 391 | Downloads used a generic filename rather than the required `output_{timestamp}.{ext}` scheme. | Fixed |
| HIGH | `app/error.tsx` | 18 | The route error boundary displayed raw `error.message`, which could leak internal details to users. | Fixed |
| MEDIUM | `app/api/run/route.ts` | 48 | Error normalization was inconsistent; parser traces and engine stderr could surface implementation details. | Fixed |
| MEDIUM | `lib/commandCompatibility.ts` | 54 | The web UI’s documented semantics for `uniq -f key` and `format-values -f %.2f -k field` did not match raw Miller behavior. | Fixed |
| LOW | `components/InputPanel.tsx` | 39 | The input panel lacked a visible size counter, reducing discoverability of the 10 MB limit. | Fixed |
| LOW | `app/layout.tsx` | 14 | The app shell lacked a skip link and explicit global focus-visible styling for keyboard users. | Fixed |

## No-Findings Areas

- TypeScript: no remaining compile errors
- ESLint: no remaining warnings or errors
- Console traces: no `console.*` calls in app source
- Host-command injection: no shell-string execution path
