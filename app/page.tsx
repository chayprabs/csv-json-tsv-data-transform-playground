import { Suspense } from "react";

import { GridcraftStudio } from "@/components/GridcraftStudio";

import { decodeSharedStateValue } from "@/lib/shareState";

interface HomeProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchParamValue(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

async function StudioPage({ searchParams }: HomeProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSharedState = decodeSharedStateValue(
    getSearchParamValue(resolvedSearchParams?.state),
  );

  return (
    <div className="flex flex-1 flex-col">
      <GridcraftStudio initialSharedState={initialSharedState} />
    </div>
  );
}

function StudioFallback() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <section className="panel-surface p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mill</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Preparing the workspace…
        </p>
      </section>
    </main>
  );
}

export default function Home(props: HomeProps) {
  return (
    <Suspense fallback={<StudioFallback />}>
      <StudioPage {...props} />
    </Suspense>
  );
}
