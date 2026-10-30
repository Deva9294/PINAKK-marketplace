import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const status = request.nextUrl.searchParams.get("status");
    const filter = status && ["pending", "confirmed", "processing", "ready", "shipped", "delivered", "cancelled"].includes(status) ? { status } : {};
    const page = Math.max(1, Math.min(10000, Number(request.nextUrl.searchParams.get("page")) || 1));
    const limit = 25;
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    return NextResponse.json({ ok: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load orders" }, { status: 503 });
  }
}
