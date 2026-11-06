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
    const refundEntity = event?.payload?.refund?.entity;
    if (typeof event.event === "string" && event.event.startsWith("refund.") && refundEntity?.payment_id) {
      await connectToDatabase();
      const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
      if (!payment) return NextResponse.json({ ok: true, ignored: true });
      const refundStatus = refundEntity.status === "processed" ? "processed"
        : refundEntity.status === "failed" ? "failed" : "pending";
      const updateFilter = refundStatus === "processed"
        ? { _id: payment._id }
        : refundStatus === "failed"
          ? { _id: payment._id, refundStatus: { $ne: "processed" } }
          : { _id: payment._id, refundStatus: { $nin: ["processed", "failed"] } };
      await Payment.updateOne(updateFilter, {
        $set: {
          refundId: refundEntity.id || payment.refundId,
          refundStatus,
          refundAmount: Number(refundEntity.amount || payment.refundAmount || 0),
        },
      });
      const currentPayment = await Payment.findById(payment._id);
      if (currentPayment?.refundStatus === "processed" && currentPayment.refundAmount >= currentPayment.amount) {
        await Order.updateOne({ _id: currentPayment.orderId, paymentStatus: "paid" }, { $set: { paymentStatus: "refunded" } });
      }
      return NextResponse.json({ ok: true, refundStatus: currentPayment?.refundStatus || refundStatus });
    }

    const entity = event?.payload?.payment?.entity;
    if (!entity?.order_id) return NextResponse.json({ ok: true, ignored: true });
    await connectToDatabase();
    const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) return NextResponse.json({ ok: true, ignored: true });
    const order = await Order.findById(payment.orderId);
    if (!order) return NextResponse.json({ ok: true, ignored: true });

    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (entity.amount !== payment.amount || entity.currency !== "INR") {
        console.error("Razorpay webhook amount/currency mismatch for", payment.orderNumber);
        return NextResponse.json({ ok: false, error: "Payment amount mismatch" }, { status: 400 });
      }
      if (payment.status !== "paid") {
        payment.status = "paid";
        payment.razorpayPaymentId = entity.id || payment.razorpayPaymentId;
        await payment.save();
      }
      if (order.status === "cancelled") {
        // A late capture can arrive after an unpaid order was cancelled and stock restored.
        // Keep the order cancelled, record the captured payment, and flag it for an admin refund.
        order.paymentStatus = "paid";
        order.paymentMethod = "razorpay";
        await order.save();
        console.error("Captured Razorpay payment received for cancelled order; refund review required:", order.orderNumber, entity.id || "");
      } else if (order.paymentStatus !== "paid") {
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
