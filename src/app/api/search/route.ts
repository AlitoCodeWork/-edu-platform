import { NextRequest, NextResponse } from "next/server";
import { aggregate, type AggregateResult } from "@/lib/content/aggregator";
import { adapters } from "@/lib/content/adapters";
import { TtlCache } from "@/lib/content/cache";
import type { ContentType } from "@/lib/content/types";

const cache = new TtlCache<AggregateResult>(5 * 60 * 1000); // 5 minutes

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [], failedSources: [] });

  const typesParam = req.nextUrl.searchParams.get("types");
  const types = typesParam
    ? (typesParam.split(",").filter(Boolean) as ContentType[])
    : undefined;

  const cacheKey = `${q}::${types?.join(",") ?? "all"}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const result = await aggregate(q, adapters, { types });
  cache.set(cacheKey, result);
  return NextResponse.json(result);
}
