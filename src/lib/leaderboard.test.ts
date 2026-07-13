import { describe, it, expect } from "vitest";
import { rankWeekly } from "./leaderboard";

const week = "2026-W29";

describe("rankWeekly", () => {
  it("sums best-per-exam per user and ranks desc", () => {
    const attempts = [
      { userId: "a", examId: "e1", score: 3, week },
      { userId: "a", examId: "e1", score: 5, week }, // best for a/e1 = 5
      { userId: "a", examId: "e2", score: 2, week }, // a total = 7
      { userId: "b", examId: "e1", score: 8, week }, // b total = 8
      { userId: "c", examId: "e1", score: 4, week: "2026-W28" }, // other week
    ];
    expect(rankWeekly(attempts, week)).toEqual([
      { userId: "b", total: 8, rank: 1 },
      { userId: "a", total: 7, rank: 2 },
    ]);
  });

  it("ignores other weeks", () => {
    const other = [{ userId: "c", examId: "e1", score: 4, week: "2026-W28" }];
    expect(rankWeekly(other, week)).toEqual([]);
  });
});
