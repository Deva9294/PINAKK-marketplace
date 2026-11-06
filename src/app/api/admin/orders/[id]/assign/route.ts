import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ ok: false, error: "Invalid order ID" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const deliveryBoyId = typeof body?.deliveryBoyId === "string" ? body.deliveryBoyId : "";
  if (deliveryBoyId && !mongoose.isValidObjectId(deliveryBoyId)) return NextResponse.json({ ok: false, error: "Invalid delivery account" }, { status: 400 });

  try {
    await connectToDatabase();
    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    if (order.fulfillmentMethod !== "delivery" || !["ready", "shipped"].includes(order.status)) {
      return NextResponse.json(
        { ok: false, error: "Order must be ready for dispatch before assigning delivery" },
        { status: 409 }
      );
    }

    if (!deliveryBoyId) {
      order.deliveryBoyId = null;
    } else {
      const staff = await User.findOne({ _id: deliveryBoyId, role: "delivery", active: true }).select("_id").lean();
      if (!staff) return NextResponse.json({ ok: false, error: "Active delivery account not found" }, { status: 404 });
      order.deliveryBoyId = staff._id;
    }
    await order.save();
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, deliveryBoyId: order.deliveryBoyId ? String(order.deliveryBoyId) : null });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not assign delivery" }, { status: 503 });
  }
}
