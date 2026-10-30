import { SignJWT, jwtVerify } from "jose";
import { scrypt as scryptCallback, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest } from "next/server";
const scrypt = promisify(scryptCallback);
export const USER_COOKIE = "pinakk_user_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error("AUTH_SECRET must contain at least 32 bytes");
  return new TextEncoder().encode(value);
};
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return salt + ":" + key.toString("hex");
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
export async function createUserToken(user: { id: string; role: string }) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id)
    .setIssuedAt().setExpirationTime("7d").setIssuer("pinakk-marketplace").setAudience("pinakk-user").sign(secret());
}
export async function readUserSession(request: NextRequest) {
  const token = request.cookies.get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "pinakk-marketplace", audience: "pinakk-user", algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { id: payload.sub, role: payload.role };
  } catch { return null; }
}
export const userCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };
