import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/places", () => {
  it("returns 400 when q is missing", async () => {
    const req = new Request("http://localhost/api/places");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when q is empty", async () => {
    const req = new Request("http://localhost/api/places?q=");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });
});
