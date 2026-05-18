import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-8 text-sm text-[color:var(--muted)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:px-6">
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          aria-label="Legal and policies"
        >
          <Link
            className="font-medium text-[color:var(--foreground)] underline-offset-2 hover:underline"
            href="/privacy"
          >
            Privacy
          </Link>
          <Link
            className="font-medium text-[color:var(--foreground)] underline-offset-2 hover:underline"
            href="/terms"
          >
            Terms of use
          </Link>
        </nav>
        <p className="max-w-2xl text-center text-xs leading-relaxed">
          Mill processes your pasted data on this server to run transforms. Do
          not paste secrets or regulated personal data you are not allowed to
          share. Outputs and the app are provided as-is, without warranties;
          you use them at your own risk.
        </p>
      </div>
    </footer>
  );
}
