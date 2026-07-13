import { describe, it, expect } from "vitest";
import { mapSerpapiYoutube } from "./youtube";

// Fixture captured from the real SerpApi youtube-search response.
const fixture = {
  video_results: [
    {
      title: "Python Full Course for Beginners",
      link: "https://www.youtube.com/watch?v=K5KVEU3aaeQ",
      video_id: "K5KVEU3aaeQ",
      thumbnail: { static: "https://i.ytimg.com/vi/K5KVEU3aaeQ/hq720.jpg" },
    },
  ],
};

describe("mapSerpapiYoutube", () => {
  it("normalizes to an embed-only video and never exposes a download", () => {
    const r = mapSerpapiYoutube(fixture)[0];
    expect(r.id).toBe("youtube:K5KVEU3aaeQ");
    expect(r.type).toBe("video");
    expect(r.source).toBe("youtube");
    expect(r.license).toBe("youtube-embed");
    expect(r.embedUrl).toBe("https://www.youtube.com/embed/K5KVEU3aaeQ");
    expect(r.downloadUrl).toBeUndefined(); // legal guardrail
    expect(r.sourceUrl).toContain("watch?v=K5KVEU3aaeQ");
    expect(r.thumbnail).toContain("ytimg");
  });

  it("handles empty results", () => {
    expect(mapSerpapiYoutube({})).toEqual([]);
  });
});
