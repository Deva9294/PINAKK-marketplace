import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import DeliveryLocation from "@/models/DeliveryLocation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const orders = await Order.find({ fulfillmentMethod: "delivery", status: "shipped", deliveryBoyId: { $ne: null } })
      .select("orderNumber customer address deliveryBoyId status").populate("deliveryBoyId", "name phone").sort({ updatedAt: -1 }).limit(100).lean();
    const locations = await DeliveryLocation.find({ orderId: { $in: orders.map(o => o._id) } })
      .select("orderId lat lng accuracy updatedAt").lean();
    const byOrder = new Map(locations.map((x: any) => [String(x.orderId), x]));
    return NextResponse.json({ ok: true, deliveries: orders.map((o: any) => ({
      orderId: String(o._id), orderNumber: o.orderNumber, customer: o.customer,
      deliveryBoy: o.deliveryBoyId, address: o.address, location: byOrder.get(String(o._id)) || null
    })) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load live delivery locations" }, { status: 503 });
  }
}
