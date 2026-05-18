import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use — Mill",
  description: "Terms of use for the Mill data transformation workspace.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main
        className="mx-auto min-h-[60vh] w-full max-w-2xl flex-1 px-4 py-12 sm:px-6"
        id="main-content"
      >
      <p className="mb-6 text-sm text-[color:var(--muted)]">
        <Link
          className="font-medium text-[color:var(--accent)] hover:underline"
          href="/"
        >
          ← Back to Mill
        </Link>
      </p>
      <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">
        Terms of use
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-6 text-[color:var(--foreground)]">
        <p>
          By using Mill you agree that the software and any transform output
          are provided <strong>as is</strong>, without warranties of any kind.
          The authors and operators are <strong>not liable</strong> for any
          damages, data loss, or decisions made based on transformed output.
        </p>
        <p>
          You are responsible for the data you paste, the commands you run,
          and compliance with laws and contracts that apply to you. Do not use
          Mill to process unlawful content or to violate others&apos; rights.
        </p>
        <p>
          These terms are a minimal baseline notice and are not a substitute
          for legal advice. Operators may publish additional terms for their
          deployment.
        </p>
      </div>
      </main>
    </div>
  );
}
