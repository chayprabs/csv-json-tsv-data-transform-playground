# Security Policy

## Reporting

If you discover a security vulnerability in Mill, please report it responsibly:

1. Open a **private** security advisory on [GitHub](https://github.com/chayprabs/csv-json-tsv-data-transform-playground/security/advisories/new), or
2. Contact the maintainer via [chaitanyaprabuddha.com](https://www.chaitanyaprabuddha.com).

Do not file public issues for exploitable vulnerabilities before a fix is available.

## Supported versions

Security fixes are applied to the `main` branch. Deploy the latest commit for production instances.

## Threat model (summary)

Mill runs **Miller (`mlr`)** on the server with user-supplied data and commands. Defenses include:

- No shell execution (`execa` with argv only, empty `env`)
- Command tokenisation and workspace policy (blocked file paths, `tee`, `join`, DSL `exec`/`system`/`stat`, etc.)
- Input and body size limits, rate limiting, sanitised errors
- CSP and security headers via Next.js config

Operators must:

- Deploy behind TLS with a trusted reverse proxy
- Set `MILL_ALLOWED_ORIGIN` when the API is used cross-origin
- Not expose the service to untrusted networks without additional WAF/rate limits

## Out of scope

Mill is not designed for regulated data (HIPAA, PCI, etc.) without your own compliance review.
