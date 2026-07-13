import { describe, it, expect } from "vitest";
import { mapGoogleNews } from "./news";

const xml = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Nueva versión de un lenguaje de programación</title>
    <link>https://news.example.com/articulo-1</link>
    <pubDate>Mon, 13 Jul 2026 10:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

describe("mapGoogleNews", () => {
  it("maps a news item to link-out only (no embed, no download)", () => {
    const r = mapGoogleNews(xml)[0];
    expect(r.type).toBe("news");
    expect(r.license).toBe("news-link");
    expect(r.sourceUrl).toBe("https://news.example.com/articulo-1");
    expect(r.embedUrl).toBeUndefined();
    expect(r.downloadUrl).toBeUndefined();
  });
});
