import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const KEY_LEN = 64;

/** Store as `scrypt$<saltHex>$<hashHex>` */
export async function hashPassword(password: string): Promise<string> {
  const trimmed = password.trim();
  if (!trimmed) {
    throw new Error("Password cannot be empty");
  }
  const salt = randomBytes(16);
  const derived = (await scryptAsync(trimmed, salt, KEY_LEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = (await scryptAsync(
    password.trim(),
    salt,
    expected.length
  )) as Buffer;

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
