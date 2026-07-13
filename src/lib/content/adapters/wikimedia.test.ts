import { describe, it, expect } from "vitest";
import { mapWikimedia } from "./wikimedia";

const fixture = {
  query: {
    pages: {
      "589914": {
        pageid: 589914,
        title: "File:Personal computer, exploded.svg",
        imageinfo: [
          {
            url: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Personal_computer%2C_exploded.svg",
            thumburl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/pc.svg/250px.png",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:Personal_computer,_exploded.svg",
          },
        ],
      },
    },
  },
};

describe("mapWikimedia", () => {
  it("normalizes a Commons image to a downloadable CC result", () => {
    const r = mapWikimedia(fixture)[0];
    expect(r.id).toBe("wikimedia:589914");
    expect(r.type).toBe("image");
    expect(r.license).toBe("cc");
    expect(r.title).toBe("Personal computer, exploded.svg");
    expect(r.downloadUrl).toContain("upload.wikimedia.org");
    expect(r.thumbnail).toContain("250px");
  });
});
