import Link from "next/link";

import {
  MILL_GITHUB_URL,
  MILL_WEBSITE_URL,
  MILL_X_URL,
} from "@/lib/siteLinks";

const externalLinkClass =
  "rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]";

export function SiteHeader() {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]"
          href="/"
        >
          Mill
        </Link>
        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label="External links"
        >
          <a
            className={externalLinkClass}
            href={MILL_GITHUB_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className={externalLinkClass}
            href={MILL_X_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            X
          </a>
          <a
            className={externalLinkClass}
            href={MILL_WEBSITE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Miller docs
          </a>
        </nav>
      </div>
    </header>
  );
}
