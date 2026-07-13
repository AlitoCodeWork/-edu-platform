import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("round-trips a correct password", async () => {
    const h = await hashPassword("s3cret!");
    expect(await verifyPassword("s3cret!", h)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const h = await hashPassword("s3cret!");
    expect(await verifyPassword("nope", h)).toBe(false);
  });
});
