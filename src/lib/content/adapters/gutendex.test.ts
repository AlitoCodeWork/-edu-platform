import { describe, it, expect } from "vitest";
import { mapGutendex } from "./gutendex";

// Fixture captured from the real Gutendex API (search=mathematics).
const fixture = {
  results: [
    {
      id: 16713,
      title: "Amusements in Mathematics",
      formats: {
        "application/epub+zip": "https://www.gutenberg.org/ebooks/16713.epub3.images",
        "image/jpeg": "https://www.gutenberg.org/cache/epub/16713/pg16713.cover.medium.jpg",
        "text/plain; charset=utf-8": "https://www.gutenberg.org/ebooks/16713.txt.utf-8",
      },
    },
  ],
};

describe("mapGutendex", () => {
  it("normalizes to a public-domain book", () => {
    const r = mapGutendex(fixture)[0];
    expect(r.id).toBe("gutenberg:16713");
    expect(r.type).toBe("book");
    expect(r.source).toBe("gutenberg");
    expect(r.license).toBe("public-domain");
    expect(r.downloadUrl).toContain(".epub");
    expect(r.thumbnail).toContain("cover");
    expect(r.sourceUrl).toBe("https://www.gutenberg.org/ebooks/16713");
  });

  it("handles empty results", () => {
    expect(mapGutendex({})).toEqual([]);
  });
});
