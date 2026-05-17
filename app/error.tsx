"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
}

export default function ErrorPage({ error }: ErrorPageProps) {
  void error;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <section className="panel-surface p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--danger)]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Reload the page to try again.
        </p>
        <button
          className="mt-5 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-strong)]"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </section>
    </main>
  );
}
