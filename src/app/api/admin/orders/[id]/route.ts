import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = ["pending", "confirmed", "processing", "ready", "shipped", "delivered", "cancelled"];
const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "shipped", "cancelled"],
  ready: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid order ID" }, { status: 400 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (!body || !allowed.includes(body.status)) return NextResponse.json({ ok: false, error: "Invalid order status" }, { status: 400 });
  try {
    await connectToDatabase();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (!transitions[order.status]?.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "This order status transition is not allowed" }, { status: 409 });
    }
    order.status = body.status;
    await order.save();
    return NextResponse.json({ ok: true, order: { id: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt } });
  } catch (error) {
    console.error("PATCH /api/admin/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update order" }, { status: 503 });
  }
}
