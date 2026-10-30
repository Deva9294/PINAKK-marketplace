import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { createUserToken, verifyPassword, USER_COOKIE, userCookieOptions } from "@/lib/user-auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok:false, error:"Invalid request" }, { status:400 }); }
  const identity = typeof body?.identity === "string" ? body.identity.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identity || !password || identity.length > 254 || password.length > 128) return NextResponse.json({ ok:false, error:"Enter your mobile/email and password" }, { status:400 });
  try {
    await connectToDatabase();
    const user = await User.findOne({ $or:[{ phone:identity },{ email:identity }] });
    if (!user || !user.active || !(await verifyPassword(password,user.passwordHash))) return NextResponse.json({ ok:false, error:"Incorrect login details" }, { status:401 });
    const token = await createUserToken({ id:String(user._id), role:user.role });
    const response = NextResponse.json({ ok:true, user:{ name:user.name, phone:user.phone, email:user.email, role:user.role } });
    response.cookies.set(USER_COOKIE,token,userCookieOptions);
    return response;
  } catch (error) { console.error("Account login failed",error); return NextResponse.json({ ok:false,error:"Account service unavailable" },{status:503}); }
}
