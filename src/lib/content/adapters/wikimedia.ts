import type { RawResult, SourceAdapter } from "../types";

interface WmImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
}
interface WmPage {
  pageid: number;
  title: string;
  imageinfo?: WmImageInfo[];
}
interface WmResponse {
  query?: { pages?: Record<string, WmPage> };
}

/** Pure: Wikimedia Commons files are CC/PD, so all are downloadable. */
export function mapWikimedia(json: WmResponse): RawResult[] {
  const pages = json.query?.pages ? Object.values(json.query.pages) : [];
  const out: RawResult[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info?.url) continue;
    out.push({
      id: `wikimedia:${p.pageid}`,
      type: "image",
      title: p.title.replace(/^File:/, ""),
      source: "wikimedia",
      license: "cc",
      thumbnail: info.thumburl,
      downloadUrl: info.url,
      sourceUrl: info.descriptionurl ?? info.url,
    });
  }
  return out;
}

export const wikimedia: SourceAdapter = {
  name: "wikimedia",
  types: ["image"],
  async search(q, signal) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrlimit=10&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&iiurlwidth=200`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`wikimedia ${res.status}`);
    return mapWikimedia((await res.json()) as WmResponse);
  },
};
