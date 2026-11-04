import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await readUserSession(request);
  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, error: "Please sign in before paying online" }, { status: 401 });
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ ok: false, error: "Online payment is not configured. Choose another payment method." }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  const orderNumber = body && typeof body === "object" && "orderNumber" in body && typeof body.orderNumber === "string"
    ? body.orderNumber.trim() : "";
  if (!orderNumber || orderNumber.length > 40) {
    return NextResponse.json({ ok: false, error: "Valid order number is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const order = await Order.findOne({ orderNumber, customerUserId: session.id });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "paid" || order.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "This order cannot be paid" }, { status: 409 });
    }
    const amount = Math.round(Number(order.total) * 100);
    if (!Number.isSafeInteger(amount) || amount < 100) {
      return NextResponse.json({ ok: false, error: "Order amount is invalid" }, { status: 400 });
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency: "INR", receipt: order.orderNumber.slice(0, 40), notes: { orderNumber: order.orderNumber } }),
      cache: "no-store",
    });
    const result = await response.json() as { id?: string; error?: { description?: string } };
    if (!response.ok || !result.id) {
      console.error("Razorpay order creation failed:", result.error?.description || response.status);
      return NextResponse.json({ ok: false, error: "Could not start payment. Please try again." }, { status: 502 });
    }

    await Payment.create({
      orderId: order._id, orderNumber: order.orderNumber, customerUserId: session.id,
      razorpayOrderId: result.id, amount, currency: "INR", status: "created",
    });
    return NextResponse.json({ ok: true, keyId, razorpayOrderId: result.id, amount, currency: "INR", orderNumber: order.orderNumber });
  } catch (error) {
    console.error("POST /api/payments/create-order failed:", error);
    return NextResponse.json({ ok: false, error: "Payment service is temporarily unavailable" }, { status: 503 });
  }
}
