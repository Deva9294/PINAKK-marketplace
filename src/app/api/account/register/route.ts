import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { createUserToken, hashPassword, USER_COOKIE, userCookieOptions } from "@/lib/user-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const phone = rawPhone.replace(/[\s-]/g, "");
  const password = typeof body?.password === "string" ? body.password : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (
    name.length < 2 ||
    name.length > 100 ||
    !/^(?:\+91)?[6-9]\d{9}$/.test(phone) ||
    password.length < 8 ||
    password.length > 128 ||
    (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
  ) {
    return NextResponse.json(
      { ok: false, error: "Enter your name, valid Indian mobile number and password (8–128 characters)." },
      { status: 400 }
    );
  }

  // Check signing configuration before writing the user. Previously a missing
  // AUTH_SECRET could create the account and then fail while issuing its cookie.
  if (!process.env.AUTH_SECRET || Buffer.byteLength(process.env.AUTH_SECRET) < 32) {
    console.error("Account registration unavailable: AUTH_SECRET is missing or shorter than 32 bytes.");
    return NextResponse.json(
      { ok: false, error: "Account setup is incomplete on the server. Please contact the store administrator." },
      { status: 503 }
    );
  }

  try {
    await connectToDatabase();

    const duplicateConditions: Array<Record<string, string>> = [{ phone }];
    if (email) duplicateConditions.push({ email });
    const exists = await User.findOne({ $or: duplicateConditions }).select("_id").lean();

    if (exists) {
      return NextResponse.json(
        { ok: false, error: "An account with this mobile number or email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      phone,
      ...(email ? { email } : {}),
      passwordHash,
      role: "customer",
    });

    const token = await createUserToken({ id: String(user._id), role: "customer" });
    const response = NextResponse.json(
      { ok: true, user: { name: user.name, phone: user.phone, email: user.email, role: user.role } },
      { status: 201 }
    );
    response.cookies.set(USER_COOKIE, token, userCookieOptions);
    return response;
  } catch (error) {
    console.error("Account registration failed:", error);
    const mongoError = error as { code?: number; codeName?: string };
    if (mongoError?.code === 11000) {
      return NextResponse.json(
        { ok: false, error: "An account with this mobile number or email already exists. Please sign in instead." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Account service is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}
