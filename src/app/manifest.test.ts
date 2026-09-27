import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("web app manifest", () => {
  it("exposes installable PWA fields", () => {
    const m = manifest();
    expect(m.name).toBe("Tourister");
    expect(m.short_name).toBe("Tourister");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.icons?.some((i) => i.sizes === "192x192")).toBe(true);
    expect(m.icons?.some((i) => i.sizes === "512x512")).toBe(true);
  });
});
