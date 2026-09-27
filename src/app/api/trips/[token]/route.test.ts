import { describe, it, expect } from "vitest";
import { DELETE } from "./route";

describe("DELETE /api/trips/[token]", () => {
  it("returns 400 when token is empty", async () => {
    const req = new Request("http://localhost/api/trips/", {
      method: "DELETE",
    });
    const res = await DELETE(req as never, {
      params: Promise.resolve({ token: "" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Token");
  });
});
