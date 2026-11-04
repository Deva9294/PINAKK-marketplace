import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Webhook is not configured" }, { status: 503 });
  const signature = request.headers.get("x-razorpay-signature") || "";
  const rawBody = await request.text();
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { received = Buffer.alloc(0); }
  if (!signature || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as any;
    const entity = event?.payload?.payment?.entity;
    if (!entity?.order_id) return NextResponse.json({ ok: true, ignored: true });
    await connectToDatabase();
    const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) return NextResponse.json({ ok: true, ignored: true });
    const order = await Order.findById(payment.orderId);
    if (!order) return NextResponse.json({ ok: true, ignored: true });

    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (payment.status !== "paid") {
        payment.status = "paid";
        payment.razorpayPaymentId = entity.id || payment.razorpayPaymentId;
        await payment.save();
      }
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.paymentMethod = "razorpay";
        if (order.status === "pending") order.status = "confirmed";
        await order.save();
      }
    } else if (event.event === "payment.failed" && payment.status !== "paid") {
      payment.status = "failed";
      payment.razorpayPaymentId = entity.id || "";
      await payment.save();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
