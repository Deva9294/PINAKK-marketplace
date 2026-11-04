import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqualHex(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const session = await readUserSession(request);
  if (!session || session.role !== "customer") return NextResponse.json({ ok: false, error: "Customer sign-in required" }, { status: 401 });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Online payment is not configured" }, { status: 503 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature || orderId.length > 100 || paymentId.length > 100) {
    return NextResponse.json({ ok: false, error: "Payment verification details are incomplete" }, { status: 400 });
  }
  const expected = createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex");
  if (!safeEqualHex(signature, expected)) return NextResponse.json({ ok: false, error: "Payment signature is invalid" }, { status: 400 });

  try {
    await connectToDatabase();
    const payment = await Payment.findOne({ razorpayOrderId: orderId, customerUserId: session.id });
    if (!payment) return NextResponse.json({ ok: false, error: "Payment record not found" }, { status: 404 });
    if (payment.status === "paid") return NextResponse.json({ ok: true, verified: true, orderNumber: payment.orderNumber });
    const order = await Order.findOne({ _id: payment.orderId, customerUserId: session.id });
    if (!order || order.status === "cancelled") return NextResponse.json({ ok: false, error: "Order is unavailable" }, { status: 409 });

    payment.razorpayPaymentId = paymentId;
    payment.signature = signature;
    payment.status = "paid";
    await payment.save();
    order.paymentStatus = "paid";
    order.paymentMethod = "razorpay";
    if (order.status === "pending") order.status = "confirmed";
    await order.save();
    return NextResponse.json({ ok: true, verified: true, orderNumber: order.orderNumber, status: order.status });
  } catch (error) {
    console.error("POST /api/payments/verify failed:", error);
    return NextResponse.json({ ok: false, error: "Could not verify payment status" }, { status: 503 });
  }
}
