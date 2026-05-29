export function SeoIntroBar() {
  return (
    <section
      aria-label="About Mill"
      className="border-b border-[color:var(--border)] bg-[color:var(--surface-muted)]"
    >
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <p className="text-center text-sm leading-snug text-[color:var(--muted)]">
          Paste CSV, TSV, JSON, NDJSON, or DKVP — run Miller (
          <code className="text-[color:var(--foreground)]">mlr</code>) command
          chains in your browser workspace, then copy or download the result.
        </p>
        <p className="mt-1 text-center text-sm leading-snug text-[color:var(--muted)]">
          Filter, sort, reshape, and convert tabular data without installing
          tools. Data is processed on this server — do not paste secrets.
        </p>
      </div>
    </section>
  );
}
