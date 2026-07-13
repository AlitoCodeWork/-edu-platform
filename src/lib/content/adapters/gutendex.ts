import type { RawResult, SourceAdapter } from "../types";

interface GutendexBook {
  id: number;
  title: string;
  formats: Record<string, string>;
}
interface GutendexResponse {
  results?: GutendexBook[];
}

function pickDownload(formats: Record<string, string>): string | undefined {
  return (
    formats["application/epub+zip"] ??
    formats["text/plain; charset=utf-8"] ??
    formats["text/plain; charset=us-ascii"]
  );
}

/** Pure: map a Gutendex response to normalized public-domain book results. */
export function mapGutendex(json: GutendexResponse): RawResult[] {
  return (json.results ?? []).map((b) => ({
    id: `gutenberg:${b.id}`,
    type: "book" as const,
    title: b.title,
    source: "gutenberg",
    license: "public-domain" as const,
    thumbnail: b.formats?.["image/jpeg"],
    downloadUrl: pickDownload(b.formats ?? {}),
    sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
  }));
}

export const gutendex: SourceAdapter = {
  name: "gutenberg",
  types: ["book"],
  async search(q, signal) {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`gutendex ${res.status}`);
    const json = (await res.json()) as GutendexResponse;
    return mapGutendex(json);
  },
};
