import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/trips", () => {
  it("returns 400 when tokens missing", async () => {
    const req = new Request("http://localhost/api/trips");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("tokens");
  });

  it("returns 400 when tokens empty", async () => {
    const req = new Request("http://localhost/api/trips?tokens=");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });
});
