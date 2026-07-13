import { describe, it, expect } from "vitest";
import { isoWeekKey } from "./week";

describe("isoWeekKey", () => {
  it("formats ISO week", () => {
    expect(isoWeekKey(new Date("2026-07-13T00:00:00Z"))).toBe("2026-W29");
  });
  it("handles year boundary (2027-01-01 belongs to 2026-W53)", () => {
    expect(isoWeekKey(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53");
  });
});
