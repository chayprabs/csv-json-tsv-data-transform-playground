import Link from "next/link";
const GITHUB_REPO =
  "https://github.com/chayprabs/csv-json-tsv-data-transform-playground";
const TWITTER_URL = "https://x.com/chayprabs";
const WEBSITE_URL = "https://www.chaitanyaprabuddha.com";

function GitHubIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]"
          href="/"
        >
          Mill
        </Link>
        <nav
          aria-label="External links"
          className="flex items-center gap-1 sm:gap-2"
        >
          <a
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            href={GITHUB_REPO}
            rel="noopener noreferrer"
            target="_blank"
            title="View source on GitHub"
          >
            <GitHubIcon />
            <span className="sr-only">GitHub</span>
          </a>
          <a
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            href={TWITTER_URL}
            rel="noopener noreferrer"
            target="_blank"
            title="Chaitanya on X"
          >
            <XIcon />
            <span className="sr-only">X (Twitter)</span>
          </a>
          <a
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            href={WEBSITE_URL}
            rel="noopener noreferrer"
            target="_blank"
            title="Chaitanya Prabuddha — personal site"
          >
            <GlobeIcon />
            <span className="sr-only">Personal website</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
