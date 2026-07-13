import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./session";

describe("session", () => {
  it("signs a token that verifies back to the userId", async () => {
    const token = await signSession("user123");
    expect(await verifySession(token)).toBe("user123");
  });
  it("rejects a tampered token", async () => {
    const token = await signSession("user123");
    expect(await verifySession(token + "x")).toBeNull();
  });
  it("rejects garbage", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});
