import { XMLParser } from "fast-xml-parser";
import type { RawResult, SourceAdapter } from "../types";

const parser = new XMLParser({ ignoreAttributes: true });

interface RssItem {
  title?: string;
  link?: string;
}

/** Pure: news is link-out only — never embedded, never downloadable. */
export function mapGoogleNews(xml: string): RawResult[] {
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  const list: RssItem[] = Array.isArray(items) ? items : items ? [items] : [];
  return list
    .filter((it) => it.link)
    .map((it, i) => ({
      id: `news:${it.link ?? i}`,
      type: "news" as const,
      title: it.title ?? "",
      source: "news",
      license: "news-link" as const,
      sourceUrl: it.link as string,
    }));
}

export const news: SourceAdapter = {
  name: "news",
  types: ["news"],
  async search(q, signal) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
      q
    )}&hl=es-419&gl=US&ceid=US:es`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`news ${res.status}`);
    return mapGoogleNews(await res.text());
  },
};
