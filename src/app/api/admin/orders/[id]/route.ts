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

  let dbSession: mongoose.ClientSession | null = null;
  let result: any = null;
  let failure: "not_found" | "transition" | null = null;
  try {
    await connectToDatabase();
    dbSession = await mongoose.startSession();
    await dbSession.withTransaction(async () => {
      const order = await Order.findById(id).session(dbSession);
      if (!order) { failure = "not_found"; return; }
      if (!transitions[order.status]?.includes(body.status)) { failure = "transition"; return; }

      if (body.status === "cancelled") {
        // Restore reserved inventory and write its audit trail in the same
        // transaction as cancellation, so retries cannot double-restock.
        for (const item of order.items) {
          const product = await Product.findOneAndUpdate(
            { _id: item.productId },
            { $inc: { stock: item.quantity } },
            { new: false, session: dbSession, projection: { name: 1, stock: 1 } }
          ).lean();
          if (!product) throw new Error("A cancelled order references a missing product");
          await StockMovement.create([{
            productId: item.productId,
            productName: product.name || item.name,
            type: "order_rollback",
            quantity: item.quantity,
            beforeStock: product.stock,
            afterStock: product.stock + item.quantity,
            reference: order.orderNumber,
            note: "Inventory restored after order cancellation"
          }], { session: dbSession });
        }
      }

      order.status = body.status;
      await order.save({ session: dbSession });
      result = { id: order.id, orderNumber: order.orderNumber, status: order.status, updatedAt: order.updatedAt };
    });
    if (failure === "not_found") return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    if (failure === "transition") return NextResponse.json({ ok: false, error: "This order status transition is not allowed" }, { status: 409 });
    if (!result) return NextResponse.json({ ok: false, error: "Could not update order" }, { status: 503 });
    return NextResponse.json({ ok: true, order: result });
  } catch (error) {
    console.error("PATCH /api/admin/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update order. Verify MongoDB transaction support and server logs." }, { status: 503 });
  } finally {
    if (dbSession) await dbSession.endSession();
  }
}
