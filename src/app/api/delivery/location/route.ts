import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Order from "@/models/Order";
import DeliveryLocation from "@/models/DeliveryLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await readUserSession(request);
  if (!session || session.role !== "delivery") return NextResponse.json({ ok: false, error: "Delivery account required" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  const { orderId, lat, lng, accuracy, heading, speed } = body || {};
  if (!mongoose.isValidObjectId(orderId) || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
      (accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100000))) {
    return NextResponse.json({ ok: false, error: "Valid order and GPS coordinates are required" }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const order = await Order.findOne({ _id: orderId, deliveryBoyId: session.id, status: "shipped" }).select("_id").lean();
    if (!order) return NextResponse.json({ ok: false, error: "Live tracking is available only for your active shipped deliveries" }, { status: 404 });
    const now = new Date();
    await DeliveryLocation.findOneAndUpdate(
      { orderId, deliveryBoyId: session.id },
      {
        $set: { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
          heading: Number.isFinite(heading) ? heading : undefined, speed: Number.isFinite(speed) ? speed : undefined, updatedAt: now },
        $push: { history: { $each: [{ lat, lng, recordedAt: now }], $slice: -60 } },
        $setOnInsert: { orderId, deliveryBoyId: session.id },
      },
      { upsert: true, new: true, runValidators: true }
    );
    return NextResponse.json({ ok: true, updatedAt: now.toISOString() });
  } catch (error) {
    console.error("POST /api/delivery/location failed:", error);
    return NextResponse.json({ ok: false, error: "Could not save live location" }, { status: 503 });
  }
}
