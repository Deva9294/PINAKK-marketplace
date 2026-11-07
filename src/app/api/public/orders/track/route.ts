import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { phoneLookupValues } from "@/lib/user-auth";
import Order from "@/models/Order";
import DeliveryLocation from "@/models/DeliveryLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }

  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[\s-]/g, "") : "";
  if (!mongoose.isValidObjectId(orderId) || !/^(?:\+91)?[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: "Enter the mobile number used when placing the order" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const order = await Order.findOne({ _id: orderId, "customer.phone": { $in: phoneLookupValues(phone) } })
      .select("orderNumber status fulfillmentMethod deliveryBoyId")
      .lean();
    if (!order) return NextResponse.json({ ok: false, error: "Order not found. Check the order link and mobile number." }, { status: 404 });

    const location = order.fulfillmentMethod === "delivery" && order.status === "shipped" && order.deliveryBoyId
      ? await DeliveryLocation.findOne({ orderId, deliveryBoyId: order.deliveryBoyId })
          .select("lat lng accuracy updatedAt").lean()
      : null;
    const message = order.status === "delivered"
      ? "Order delivered."
      : location
        ? "Live courier location"
        : "Courier tracking appears after the delivery partner starts the delivery and shares GPS.";
    return NextResponse.json({
      ok: true,
      order: { orderNumber: order.orderNumber, status: order.status, fulfillmentMethod: order.fulfillmentMethod },
      location,
      message
    });
  } catch (error) {
    console.error("Guest order tracking failed:", error);
    return NextResponse.json({ ok: false, error: "Tracking service is temporarily unavailable" }, { status: 503 });
  }
}
