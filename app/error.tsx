"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
}

export default function ErrorPage({ error }: ErrorPageProps) {
  void error;

  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/40 p-4 backdrop-blur sm:p-6 lg:p-8">
        <section className="panel-surface rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--danger)]">
            Gridcraft Studio
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            The workspace ran into an unexpected problem. Reload the page to
            start fresh.
          </p>
          <button
            className="mt-5 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </section>
      </div>
    </main>
  );
}
