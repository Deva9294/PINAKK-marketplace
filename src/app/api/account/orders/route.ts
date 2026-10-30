import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Order from "@/models/Order";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountPhone = { phone: string } | null;

export async function GET(request: NextRequest) {
  const session = await readUserSession(request);
  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, error: "Please sign in" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = (await User.findById(session.id).select("phone").lean()) as AccountPhone;
    if (!user) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });

    const orders = await Order.find({
      $or: [{ customerUserId: session.id }, { "customer.phone": user.phone, customerUserId: null }]
    }).sort({ createdAt: -1 }).limit(50).lean();

    return NextResponse.json({ ok: true, orders });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load your orders" }, { status: 503 });
  }
}
