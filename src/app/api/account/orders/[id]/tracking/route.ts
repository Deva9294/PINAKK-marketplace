import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Order from "@/models/Order";
import DeliveryLocation from "@/models/DeliveryLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readUserSession(request);
  if (!session || session.role !== "customer") return NextResponse.json({ ok: false, error: "Please sign in to track your order" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid order" }, { status: 400 });
  try {
    await connectToDatabase();
    const order = await Order.findOne({ _id: id, customerUserId: session.id })
      .select("orderNumber status fulfillmentMethod deliveryBoyId address")
      .lean();
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (order.fulfillmentMethod !== "delivery" || !order.deliveryBoyId) {
      return NextResponse.json({ ok: true, order, location: null, message: "Courier tracking will appear after a delivery partner is assigned and starts the delivery." });
    }
    const location = order.status === "shipped"
      ? await DeliveryLocation.findOne({ orderId: id, deliveryBoyId: order.deliveryBoyId }).select("lat lng accuracy heading speed updatedAt history").lean()
      : null;
    return NextResponse.json({ ok: true, order, location, message: order.status === "delivered" ? "Order delivered." : location ? "Live courier location" : "Waiting for the delivery partner to share GPS location." });
  } catch {
    return NextResponse.json({ ok: false, error: "Tracking service is temporarily unavailable" }, { status: 503 });
  }
}
