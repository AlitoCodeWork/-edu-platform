import { describe, it, expect } from "vitest";
import { mapArchive } from "./archive";

const fixture = {
  response: {
    docs: [
      {
        identifier: "cc_movie_1",
        title: "Open Documentary",
        mediatype: "movies",
        licenseurl: "https://creativecommons.org/licenses/by/4.0/",
      },
      // no license -> must be skipped (conservative / legal)
      { identifier: "podcast_x", title: "Some Podcast", mediatype: "audio" },
    ],
  },
};

describe("mapArchive", () => {
  it("keeps only open-licensed, mapped-type items", () => {
    const out = mapArchive(fixture);
    expect(out).toHaveLength(1);
    const r = out[0];
    expect(r.id).toBe("archive:cc_movie_1");
    expect(r.type).toBe("video");
    expect(r.license).toBe("cc");
    expect(r.downloadUrl).toContain("/download/cc_movie_1");
  });
});
