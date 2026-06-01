import { Suspense } from "react";

import { MillWorkspace } from "@/components/MillWorkspace";

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

  return <MillWorkspace initialSharedState={initialSharedState} />;
}

function StudioFallback() {
  return (
    <main className="mx-auto min-h-[12rem] max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <section className="panel-surface p-6">
        <p className="text-sm text-[color:var(--muted)]">Preparing the workspace…</p>
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
