import { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/trip-password";

export function getTripPasswordFromRequest(request: NextRequest): string | null {
  const header = request.headers.get("x-trip-password");
  if (header?.trim()) return header.trim();
  return null;
}

/**
 * Returns true if access is allowed.
 * Trips without a password hash remain open (legacy).
 */
export async function assertTripPassword(
  passwordHash: string | null | undefined,
  request: NextRequest
): Promise<{ ok: true } | { ok: false; status: 401 }> {
  if (!passwordHash) return { ok: true };
  const password = getTripPasswordFromRequest(request);
  if (!password) return { ok: false, status: 401 };
  const valid = await verifyPassword(password, passwordHash);
  if (!valid) return { ok: false, status: 401 };
  return { ok: true };
}
