# Fixes

| Priority | Issue | File | What Changed |
|---|---|---|---|
| 1 | Error message sanitization | `app/api/run/route.ts`, `lib/errorSanitization.ts`, `lib/runTransform.ts` | Centralized sanitization for engine/parser/network errors and removed raw internal details from user-facing messages. |
| 2 | Whole-app render fallback | `app/error.tsx`, `app/global-error.tsx` | Replaced raw error output with generic reload UIs for route-level and global crashes. |
| 3 | Zero-row output handling | `components/GridcraftStudio.tsx`, `components/OutputPanel.tsx`, `lib/emptyOutput.ts` | Added visible zero-row messaging and best-effort header reconstruction for empty CSV/TSV results. |
| 3 | Command compatibility gaps | `lib/commandCompatibility.ts`, `app/api/run/route.ts`, `lib/operations.ts` | Added compatibility rewrites for `uniq -f key` and `format-values -f %.2f -k field`, and updated the reference example. |
| 3 | Validation contract mismatch | `lib/validation.ts` | Raised the command limit to 2000 chars and aligned all required validation messages with the spec. |
| 4 | Global keyboard reliability | `components/GridcraftStudio.tsx`, `components/CommandBar.tsx`, `components/VirtualizedOutput.tsx` | Moved run shortcut handling to a global listener so `Cmd/Ctrl+Enter` works from anywhere, including the output panel. |
| 5 | Loading-state completeness | `components/OutputPanel.tsx` | Standardized the in-flight output text to “Running transformation...” and kept the controls locked during execution. |
| 5 | Download filename policy | `components/GridcraftStudio.tsx` | Switched downloads to `output_{timestamp}.{ext}` with format-aware extensions. |
| 5 | Input size visibility | `components/InputPanel.tsx` | Added a visible character/byte counter and linked it to the textarea via `aria-describedby`. |
| 7 | Output rendering robustness | `components/VirtualizedOutput.tsx`, `lib/runMetrics.ts`, `lib/studioState.ts`, `components/OutputPanel.tsx`, `components/GridcraftStudio.tsx` | Removed preview-only rendering, kept full-output virtualization, reset scroll position on new output, and focused the output region for keyboard use. |
| 8 | Accessibility shell hardening | `app/layout.tsx`, `app/globals.css`, `components/GridcraftStudio.tsx` | Added a skip link, explicit focus-visible styling, and a stable `main` target for keyboard navigation. |
| 9 | Mandatory checks verified in-place | `components/GridcraftStudio.tsx`, `app/api/run/route.ts` | Verified and retained the existing request-ID stale-response guard, AbortController cancellation, and server-side session locking. |
