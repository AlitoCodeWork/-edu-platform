import type { ContentResult, ContentType, SourceAdapter } from "./types";
import { applyPolicy } from "./policy";

export interface AggregateResult {
  results: ContentResult[];
  failedSources: string[];
}

/**
 * Fan out a query to the applicable adapters in parallel. A slow/failing source
 * never breaks the whole search: each adapter has a timeout, failures are
 * collected in `failedSources`, and every result passes through the license
 * policy (illegal downloadUrls stripped).
 */
export async function aggregate(
  query: string,
  adapters: SourceAdapter[],
  opts: { types?: ContentType[]; timeoutMs?: number } = {}
): Promise<AggregateResult> {
  const { types, timeoutMs = 8000 } = opts;
  const selected = types
    ? adapters.filter((a) => a.types.some((t) => types.includes(t)))
    : adapters;

  const settled = await Promise.allSettled(
    selected.map(async (a) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        return await a.search(query, ctrl.signal);
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const results: ContentResult[] = [];
  const failedSources: string[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      for (const raw of s.value) results.push(applyPolicy(raw));
    } else {
      failedSources.push(selected[i].name);
    }
  });
  return { results, failedSources };
}
