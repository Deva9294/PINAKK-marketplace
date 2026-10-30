import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "pinakk_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 bytes");
  }
  return new TextEncoder().encode(value);
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .setIssuer("pinakk-marketplace")
    .setAudience("pinakk-admin")
    .sign(getSecret());
}

export async function isAdminRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "pinakk-marketplace",
      audience: "pinakk-admin",
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
};
