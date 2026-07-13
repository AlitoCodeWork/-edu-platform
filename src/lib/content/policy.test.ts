import { describe, it, expect } from "vitest";
import { canDownload, applyPolicy } from "./policy";
import type { RawResult } from "./types";

const base: RawResult = {
  id: "x",
  type: "video",
  title: "t",
  source: "s",
  license: "youtube-embed",
  sourceUrl: "u",
  downloadUrl: "d",
};

describe("canDownload", () => {
  it("allows open licenses", () => {
    for (const l of ["public-domain", "cc", "open-access"] as const) {
      expect(canDownload(l)).toBe(true);
    }
  });
  it("blocks youtube and news", () => {
    expect(canDownload("youtube-embed")).toBe(false);
    expect(canDownload("news-link")).toBe(false);
  });
});

describe("applyPolicy", () => {
  it("strips downloadUrl when not allowed", () => {
    expect(applyPolicy({ ...base, license: "youtube-embed" }).downloadUrl).toBeUndefined();
  });
  it("keeps downloadUrl when allowed", () => {
    expect(applyPolicy({ ...base, license: "public-domain" }).downloadUrl).toBe("d");
  });
});
