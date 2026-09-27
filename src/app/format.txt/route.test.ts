import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { ITINERARY_FORMAT_TITLE } from "@/lib/itinerary-format";

describe("GET /format.txt", () => {
  it("returns the plain-text format guide", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain(ITINERARY_FORMAT_TITLE);
    expect(body).toContain("POST /api/parse");
  });
});
