import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ADMIN_COOKIE, adminCookieOptions, createAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(actual: string, expected: string) {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expectedEmail = process.env.PINAKK_ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.PINAKK_ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword || !process.env.AUTH_SECRET) {
    return NextResponse.json({ ok: false, error: "Admin login is not configured on the server" }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
    return NextResponse.json({ ok: false, error: "Email or password is incorrect" }, { status: 401 });
  }

  try {
    const token = await createAdminToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
    return response;
  } catch (error) {
    console.error("Admin session creation failed:", error);
    return NextResponse.json({ ok: false, error: "Could not start admin session" }, { status: 500 });
  }
}
