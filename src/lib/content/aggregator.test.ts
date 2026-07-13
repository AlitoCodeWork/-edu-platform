import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregator";
import type { SourceAdapter } from "./types";

const good: SourceAdapter = {
  name: "good",
  types: ["book"],
  async search() {
    return [
      {
        id: "b1",
        type: "book",
        title: "T",
        source: "good",
        license: "public-domain",
        downloadUrl: "d",
        sourceUrl: "u",
      },
    ];
  },
};

const leaky: SourceAdapter = {
  name: "leaky",
  types: ["video"],
  async search() {
    return [
      {
        id: "y1",
        type: "video",
        title: "V",
        source: "leaky",
        license: "youtube-embed",
        downloadUrl: "SHOULD-STRIP",
        sourceUrl: "u",
      },
    ];
  },
};

const bad: SourceAdapter = {
  name: "bad",
  types: ["paper"],
  async search() {
    throw new Error("boom");
  },
};

describe("aggregate", () => {
  it("collects good results and records failed sources", async () => {
    const { results, failedSources } = await aggregate("q", [good, bad]);
    expect(results.map((r) => r.id)).toContain("b1");
    expect(failedSources).toContain("bad");
  });

  it("applies the license policy (strips an illegal downloadUrl)", async () => {
    const { results } = await aggregate("q", [leaky]);
    expect(results[0].downloadUrl).toBeUndefined();
  });

  it("filters adapters by requested type", async () => {
    const { results } = await aggregate("q", [good, leaky], { types: ["video"] });
    expect(results.every((r) => r.type === "video")).toBe(true);
  });
});
