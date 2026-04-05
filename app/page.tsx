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

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSharedState = decodeSharedStateValue(
    getSearchParamValue(resolvedSearchParams?.state),
  );

  return <GridcraftStudio initialSharedState={initialSharedState} />;
}
