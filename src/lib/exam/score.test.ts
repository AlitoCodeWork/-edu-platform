import { describe, it, expect } from "vitest";
import { scoreAttempt } from "./score";

describe("scoreAttempt", () => {
  it("counts matches", () => {
    expect(scoreAttempt([0, 1, 2], [0, 1, 2])).toEqual({ score: 3, maxScore: 3 });
    expect(scoreAttempt([0, 1, 2], [0, 9, 2])).toEqual({ score: 2, maxScore: 3 });
  });
  it("missing answers count as wrong", () => {
    expect(scoreAttempt([0, 1, 2], [0])).toEqual({ score: 1, maxScore: 3 });
    expect(scoreAttempt([0, 1, 2], [])).toEqual({ score: 0, maxScore: 3 });
  });
});
