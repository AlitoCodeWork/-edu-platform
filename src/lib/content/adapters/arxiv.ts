import { XMLParser } from "fast-xml-parser";
import type { RawResult, SourceAdapter } from "../types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

interface ArxivLink {
  "@_href"?: string;
  "@_title"?: string;
  "@_type"?: string;
}
interface ArxivEntry {
  title?: string;
  id?: string;
  link?: ArxivLink | ArxivLink[];
}

/** Pure: parse an arXiv Atom feed into open-access paper results. */
export function mapArxiv(xml: string): RawResult[] {
  const parsed = parser.parse(xml);
  const entries = parsed?.feed?.entry;
  const list: ArxivEntry[] = Array.isArray(entries) ? entries : entries ? [entries] : [];
  return list.map((e) => {
    const links = Array.isArray(e.link) ? e.link : e.link ? [e.link] : [];
    const pdf = links.find(
      (l) => l["@_title"] === "pdf" || l["@_type"] === "application/pdf"
    );
    return {
      id: `arxiv:${(e.id ?? "").split("/abs/").pop()}`,
      type: "paper" as const,
      title: (typeof e.title === "string" ? e.title : "").trim(),
      source: "arxiv",
      license: "open-access" as const,
      downloadUrl: pdf?.["@_href"],
      sourceUrl: e.id ?? "",
    };
  });
}

export const arxiv: SourceAdapter = {
  name: "arxiv",
  types: ["paper"],
  async search(q, signal) {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      q
    )}&max_results=10`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`arxiv ${res.status}`);
    return mapArxiv(await res.text());
  },
};
