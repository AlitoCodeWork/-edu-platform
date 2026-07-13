import type { RawResult, SourceAdapter } from "../types";

interface SerpapiVideo {
  title: string;
  link: string;
  video_id: string;
  thumbnail?: { static?: string };
}
interface SerpapiYoutubeResponse {
  video_results?: SerpapiVideo[];
}

/**
 * Pure: map a SerpApi youtube-search response to embed-only video results.
 * YouTube is NEVER downloadable — no `downloadUrl` is ever produced here.
 */
export function mapSerpapiYoutube(json: SerpapiYoutubeResponse): RawResult[] {
  return (json.video_results ?? []).map((v) => ({
    id: `youtube:${v.video_id}`,
    type: "video" as const,
    title: v.title,
    source: "youtube",
    license: "youtube-embed" as const,
    thumbnail: v.thumbnail?.static,
    embedUrl: `https://www.youtube.com/embed/${v.video_id}`,
    sourceUrl: v.link,
  }));
}

export const youtube: SourceAdapter = {
  name: "youtube",
  types: ["video"],
  async search(q, signal) {
    const key = process.env.SERPAPI_KEY;
    if (!key) throw new Error("SERPAPI_KEY no configurada");
    const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(
      q
    )}&api_key=${key}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`serpapi ${res.status}`);
    const json = (await res.json()) as SerpapiYoutubeResponse;
    return mapSerpapiYoutube(json);
  },
};
