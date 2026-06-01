export function SeoIntroBar() {
  return (
    <section
      className="border-b border-[color:var(--border)] bg-[color:var(--background-accent)]/40"
      aria-label="About Mill"
    >
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <p className="text-center text-sm leading-6 text-[color:var(--foreground)]">
          Mill is a browser workspace for{" "}
          <strong className="font-semibold">Miller (mlr)</strong> — paste CSV,
          TSV, JSON, NDJSON, or DKVP, run command chains, and share your
          workspace via URL. Transforms run on this server; do not paste secrets.
        </p>
      </div>
    </section>
  );
}
