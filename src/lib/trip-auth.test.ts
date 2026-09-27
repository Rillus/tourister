import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { assertTripPassword } from "./trip-auth";
import { hashPassword } from "./trip-password";

describe("assertTripPassword", () => {
  it("allows access when trip has no password", async () => {
    const req = new NextRequest("http://localhost/api/share/x");
    expect(await assertTripPassword(null, req)).toEqual({ ok: true });
    expect(await assertTripPassword(undefined, req)).toEqual({ ok: true });
  });

  it("rejects when password is set but header is missing", async () => {
    const hash = await hashPassword("secret");
    const req = new NextRequest("http://localhost/api/share/x");
    expect(await assertTripPassword(hash, req)).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("secret");
    const req = new NextRequest("http://localhost/api/share/x", {
      headers: { "x-trip-password": "wrong" },
    });
    expect(await assertTripPassword(hash, req)).toEqual({
      ok: false,
      status: 401,
    });
  });

  it("allows correct password via header", async () => {
    const hash = await hashPassword("secret");
    const req = new NextRequest("http://localhost/api/share/x", {
      headers: { "x-trip-password": "secret" },
    });
    expect(await assertTripPassword(hash, req)).toEqual({ ok: true });
  });
});
