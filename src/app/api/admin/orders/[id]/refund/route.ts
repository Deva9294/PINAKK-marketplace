import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid order ID" }, { status: 400 });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return NextResponse.json({ ok: false, error: "Razorpay is not configured" }, { status: 503 });

  try {
    await connectToDatabase();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "paid") {
      return NextResponse.json({ ok: false, error: "Only captured Razorpay orders can be refunded" }, { status: 409 });
    }
    const payment = await Payment.findOne({ orderId: order._id, status: "paid", razorpayPaymentId: { $ne: "" } }).sort({ createdAt: -1 });
    if (!payment) return NextResponse.json({ ok: false, error: "Captured Razorpay payment record not found" }, { status: 409 });
    if (payment.refundStatus === "processed" || payment.refundStatus === "pending" || payment.refundStatus === "requested") {
      return NextResponse.json({ ok: true, status: payment.refundStatus, refundId: payment.refundId || null, alreadyRequested: true });
    }
    if (payment.refundStatus === "failed") {
      return NextResponse.json({ ok: false, error: "The previous refund failed. Review the Razorpay dashboard before attempting another refund." }, { status: 409 });
    }
    if (!Number.isSafeInteger(payment.amount) || payment.amount < 100 || payment.amount !== Math.round(Number(order.total) * 100)) {
      return NextResponse.json({ ok: false, error: "Payment amount does not match the order total. Manual reconciliation is required." }, { status: 409 });
    }

    // The stable key and identical full-refund body make a retry safe after a network timeout.
    const idempotencyKey = "pinakk_refund_" + String(payment._id);
    const response = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(payment.razorpayPaymentId) + "/refund", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
        "Content-Type": "application/json",
        "X-Refund-Idempotency": idempotencyKey,
      },
      body: JSON.stringify({ amount: payment.amount, notes: { orderNumber: order.orderNumber, source: "PINAKK admin" } }),
      cache: "no-store",
    });
    const result = await response.json() as { id?: string; status?: string; amount?: number; error?: { description?: string } };
    if (!response.ok || !result.id || !["pending", "processed"].includes(result.status || "")) {
      console.error("Razorpay refund request failed:", result.error?.description || response.status);
      return NextResponse.json({ ok: false, error: result.error?.description || "Razorpay could not accept the refund request" }, { status: 502 });
    }

    payment.refundId = result.id;
    payment.refundStatus = result.status as "pending" | "processed";
    payment.refundAmount = Number(result.amount || payment.amount);
    await payment.save();
    if (payment.refundStatus === "processed" && payment.refundAmount >= payment.amount) {
      order.paymentStatus = "refunded";
      await order.save();
    }
    return NextResponse.json({ ok: true, status: payment.refundStatus, refundId: payment.refundId });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/refund failed:", error);
    return NextResponse.json({ ok: false, error: "Refund service is temporarily unavailable. Check Razorpay before retrying." }, { status: 503 });
  }
}
