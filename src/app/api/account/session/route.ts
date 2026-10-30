import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import User from "@/models/User";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const session = await readUserSession(request);
  if (!session) return NextResponse.json({ ok:true, authenticated:false });
  try {
    await connectToDatabase();
    const user = await User.findById(session.id).select("name phone email role active").lean();
    if (!user || !user.active) return NextResponse.json({ ok:true, authenticated:false });
    return NextResponse.json({ ok:true, authenticated:true, user });
  } catch { return NextResponse.json({ ok:false,error:"Account service unavailable" },{status:503}); }
}
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok:true });
  response.cookies.set("pinakk_user_session","",{ httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0 });
  return response;
}
