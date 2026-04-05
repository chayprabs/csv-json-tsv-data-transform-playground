export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/40 p-4 backdrop-blur sm:p-6 lg:p-8">
        <section className="panel-surface rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
            Gridcraft Studio
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Loading the workspace...
          </h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
            Initializing the transformation surface and loading the operation
            catalog.
          </p>
        </section>
      </div>
    </main>
  );
}
