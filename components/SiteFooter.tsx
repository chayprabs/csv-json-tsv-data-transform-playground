import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--border)] bg-white px-4 py-6">
      <nav
        aria-label="Legal"
        className="mx-auto flex max-w-5xl justify-center gap-8 text-sm"
      >
        <Link
          className="text-[color:var(--muted)] underline-offset-2 transition hover:text-[color:var(--foreground)] hover:underline"
          href="/privacy"
        >
          Privacy Policy
        </Link>
        <Link
          className="text-[color:var(--muted)] underline-offset-2 transition hover:text-[color:var(--foreground)] hover:underline"
          href="/terms"
        >
          Terms &amp; Conditions
        </Link>
      </nav>
    </footer>
  );
}
