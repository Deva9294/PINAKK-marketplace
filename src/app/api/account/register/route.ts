import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { createUserToken, hashPassword, USER_COOKIE, userCookieOptions } from "@/lib/user-auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok:false, error:"Invalid request" }, { status:400 }); }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[\s-]/g,"") : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
  if (name.length < 2 || name.length > 100 || !/^(?:\+91)?[6-9]\d{9}$/.test(phone) || password.length < 8 || password.length > 128 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ ok:false, error:"Name, valid Indian mobile number and password (8+ characters) are required" }, { status:400 });
  }
  try {
    await connectToDatabase();
    const exists = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] }).lean();
    if (exists) return NextResponse.json({ ok:false, error:"An account with this mobile number or email already exists" }, { status:409 });
    const user = await User.create({ name, phone, ...(email ? { email } : {}), passwordHash: await hashPassword(password), role:"customer" });
    const token = await createUserToken({ id:String(user._id), role:"customer" });
    const response = NextResponse.json({ ok:true, user:{ name:user.name, phone:user.phone, email:user.email, role:user.role } }, { status:201 });
    response.cookies.set(USER_COOKIE, token, userCookieOptions);
    return response;
  } catch (error) { console.error("Account registration failed", error); return NextResponse.json({ ok:false, error:"Account service unavailable" }, { status:503 }); }
}
