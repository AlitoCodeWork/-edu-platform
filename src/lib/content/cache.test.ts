import { describe, it, expect } from "vitest";
import { TtlCache } from "./cache";

describe("TtlCache", () => {
  it("returns a value within the TTL and expires it after", () => {
    let t = 0;
    const c = new TtlCache<number>(100, () => t);
    c.set("k", 42);
    expect(c.get("k")).toBe(42);
    t = 100;
    expect(c.get("k")).toBeUndefined();
  });

  it("returns undefined for a missing key", () => {
    const c = new TtlCache<number>(100);
    expect(c.get("nope")).toBeUndefined();
  });
});
