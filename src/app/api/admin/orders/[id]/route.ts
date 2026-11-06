import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = ["pending", "confirmed", "processing", "ready", "shipped", "delivered", "cancelled"];
const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "shipped", "cancelled"],
  ready: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid order ID" }, { status: 400 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (!body || !allowed.includes(body.status)) return NextResponse.json({ ok: false, error: "Invalid order status" }, { status: 400 });

  try {
    await connectToDatabase();
    if (body.status === "cancelled") {
      const dbSession = await mongoose.startSession();
      let cancelledOrder: any = null;
      try {
        await dbSession.withTransaction(async () => {
          const order = await Order.findById(id).session(dbSession);
          if (!order) throw new Error("ORDER_NOT_FOUND");
          if (!transitions[order.status]?.includes("cancelled")) throw new Error("INVALID_TRANSITION");
          if (order.paymentStatus === "paid") throw new Error("REFUND_REQUIRED");
          order.status = "cancelled";
          await order.save({ session: dbSession });

          const movements = [];
          for (const item of order.items) {
            const quantity = Number(item.quantity);
            const product = await Product.findOneAndUpdate(
              { _id: item.productId },
              { $inc: { stock: quantity } },
              { new: false, projection: { name: 1, stock: 1 }, session: dbSession }
            ).lean();
            if (!product) throw new Error("PRODUCT_NOT_FOUND");
            movements.push({
              productId: item.productId,
              productName: product.name || item.name,
              type: "order_rollback",
              quantity,
              beforeStock: product.stock,
              afterStock: product.stock + quantity,
              reference: order.orderNumber,
              note: "Stock restored after admin cancelled unpaid order",
            });
          }
          if (movements.length) await StockMovement.create(movements, { session: dbSession });
          cancelledOrder = order;
        });
      } finally {
        await dbSession.endSession();
      }
      return NextResponse.json({ ok: true, order: { id: cancelledOrder.id, orderNumber: cancelledOrder.orderNumber, status: cancelledOrder.status, updatedAt: cancelledOrder.updatedAt }, stockRestored: true });
    }

    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (!transitions[order.status]?.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "This order status transition is not allowed" }, { status: 409 });
    }
    order.status = body.status;
    await order.save();
    return NextResponse.json({ ok: true, order: { id: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ORDER_NOT_FOUND") return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (code === "INVALID_TRANSITION") return NextResponse.json({ ok: false, error: "This order status transition is not allowed" }, { status: 409 });
    if (code === "REFUND_REQUIRED") return NextResponse.json({ ok: false, error: "This order has a captured payment. Refund it before cancelling the order." }, { status: 409 });
    if (code === "PRODUCT_NOT_FOUND") return NextResponse.json({ ok: false, error: "A product in this order no longer exists. Cancellation was rolled back; reconcile the product first." }, { status: 409 });
    console.error("PATCH /api/admin/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update order. Ensure MongoDB supports transactions for stock-safe cancellation." }, { status: 503 });
  }
}
