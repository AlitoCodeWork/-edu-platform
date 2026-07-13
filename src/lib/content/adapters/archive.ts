import type { RawResult, SourceAdapter, ContentType, License } from "../types";

interface ArchiveDoc {
  identifier: string;
  title?: string | string[];
  mediatype?: string;
  licenseurl?: string | string[];
}
interface ArchiveResponse {
  response?: { docs?: ArchiveDoc[] };
}

function first(v?: string | string[]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function mediaType(mt?: string): ContentType | undefined {
  if (mt === "movies") return "video";
  if (mt === "texts") return "book";
  if (mt === "image") return "image";
  return undefined;
}
function openLicense(url?: string): License | undefined {
  if (!url) return undefined;
  if (/creativecommons/i.test(url)) return "cc";
  if (/publicdomain/i.test(url)) return "public-domain";
  return undefined;
}

/** Pure: only surfaces items with a mapped type AND a confirmed open license. */
export function mapArchive(json: ArchiveResponse): RawResult[] {
  const out: RawResult[] = [];
  for (const d of json.response?.docs ?? []) {
    const type = mediaType(d.mediatype);
    const license = openLicense(first(d.licenseurl));
    if (!type || !license) continue;
    out.push({
      id: `archive:${d.identifier}`,
      type,
      title: first(d.title) ?? d.identifier,
      source: "archive",
      license,
      thumbnail: `https://archive.org/services/img/${d.identifier}`,
      downloadUrl: `https://archive.org/download/${d.identifier}`,
      sourceUrl: `https://archive.org/details/${d.identifier}`,
    });
  }
  return out;
}

export const archive: SourceAdapter = {
  name: "archive",
  types: ["video", "book", "image"],
  async search(q, signal) {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}&fl[]=identifier&fl[]=title&fl[]=mediatype&fl[]=licenseurl&rows=10&output=json`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`archive ${res.status}`);
    return mapArchive((await res.json()) as ArchiveResponse);
  },
};
