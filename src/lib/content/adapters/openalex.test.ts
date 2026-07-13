import { describe, it, expect } from "vitest";
import { mapOpenAlex } from "./openalex";

const fixture = {
  results: [
    {
      id: "https://openalex.org/W2101234009",
      display_name: "Scikit-learn: Machine Learning in Python",
      open_access: { is_oa: true, oa_url: "https://arxiv.org/pdf/1201.0490" },
    },
    {
      id: "https://openalex.org/W999",
      display_name: "Closed paper",
      open_access: { is_oa: false, oa_url: null },
    },
  ],
};

describe("mapOpenAlex", () => {
  it("keeps only open-access works with a download URL", () => {
    const out = mapOpenAlex(fixture);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("openalex:W2101234009");
    expect(out[0].type).toBe("paper");
    expect(out[0].license).toBe("open-access");
    expect(out[0].downloadUrl).toBe("https://arxiv.org/pdf/1201.0490");
  });
});
