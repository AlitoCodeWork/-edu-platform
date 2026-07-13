export type ContentType = "video" | "book" | "magazine" | "paper" | "image" | "news";

export type License =
  | "youtube-embed"
  | "public-domain"
  | "cc"
  | "open-access"
  | "news-link";

/** A result as produced by an adapter, before the license policy is applied. */
export interface RawResult {
  id: string;
  type: ContentType;
  title: string;
  source: string;
  license: License;
  thumbnail?: string;
  embedUrl?: string;
  downloadUrl?: string;
  sourceUrl: string;
}

/** A result after the license policy has run (downloadUrl stripped if illegal). */
export type ContentResult = RawResult;

export interface SourceAdapter {
  name: string;
  types: ContentType[];
  search(q: string, signal: AbortSignal): Promise<RawResult[]>;
}
