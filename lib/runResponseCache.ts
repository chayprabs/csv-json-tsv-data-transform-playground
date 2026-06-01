import { createHash } from "node:crypto";

import { LRUCache } from "lru-cache";

import type { RunRequest } from "@/lib/apiContract";

export interface CachedRunSuccess {
  output: string;
  inputRowCount: number;
  outputRowCount: number;
  durationMs: number;
}

const cache = new LRUCache<string, CachedRunSuccess>({
  max: 100,
  ttl: 10 * 60 * 1000,
  updateAgeOnGet: false,
});

export function getRunResultCacheKey(body: RunRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        input: body.input,
        command: body.command,
        inputFormat: body.inputFormat,
        outputFormat: body.outputFormat,
      }),
    )
    .digest("hex");
}

export function getCachedRunResult(
  key: string,
): CachedRunSuccess | undefined {
  return cache.get(key);
}

export function setCachedRunResult(key: string, value: CachedRunSuccess) {
  cache.set(key, value);
}
