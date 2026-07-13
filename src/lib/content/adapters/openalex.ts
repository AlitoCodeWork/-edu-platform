import type { RawResult, SourceAdapter } from "../types";

interface OAWork {
  id: string;
  display_name: string;
  open_access?: { is_oa?: boolean; oa_url?: string | null };
}
interface OAResponse {
  results?: OAWork[];
}

/** Pure: only surfaces open-access works that expose a download URL. */
export function mapOpenAlex(json: OAResponse): RawResult[] {
  const out: RawResult[] = [];
  for (const w of json.results ?? []) {
    if (!w.open_access?.is_oa || !w.open_access.oa_url) continue;
    const shortId = w.id.split("/").pop() ?? w.id;
    out.push({
      id: `openalex:${shortId}`,
      type: "paper",
      title: w.display_name,
      source: "openalex",
      license: "open-access",
      downloadUrl: w.open_access.oa_url,
      sourceUrl: w.id,
    });
  }
  return out;
}

export const openalex: SourceAdapter = {
  name: "openalex",
  types: ["paper"],
  async search(q, signal) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      q
    )}&per-page=10`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`openalex ${res.status}`);
    return mapOpenAlex((await res.json()) as OAResponse);
  },
};
