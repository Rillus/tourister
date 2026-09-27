import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./trip-password";

describe("trip-password", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(hash).not.toContain("correct-horse");
    expect(await verifyPassword("correct-horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects empty password", async () => {
    await expect(hashPassword("")).rejects.toThrow();
    await expect(hashPassword("   ")).rejects.toThrow();
  });
});
