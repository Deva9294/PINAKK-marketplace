import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestedItem = { productId: string; quantity: number };

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }

  const customer = body?.customer;
  const method = body?.fulfillmentMethod;
  const items = body?.items as RequestedItem[] | undefined;
  if (!customer || typeof customer.name !== "string" || customer.name.trim().length < 2 || customer.name.length > 100 ||
      typeof customer.phone !== "string" || !/^(?:\+91[- ]?)?[6-9]\d{9}$/.test(customer.phone.replace(/[\s-]/g, "")) ||
      (customer.email !== undefined && (typeof customer.email !== "string" || customer.email.length > 254)) ||
      !["pickup", "delivery"].includes(method) || !Array.isArray(items) || items.length < 1 || items.length > 20) {
    return NextResponse.json({ ok: false, error: "Customer, fulfilment method or items are invalid" }, { status: 400 });
  }
  if (method === "delivery") {
    const a = body.address;
    if (!a || typeof a.line1 !== "string" || a.line1.trim().length < 5 || typeof a.city !== "string" || !a.city.trim() ||
        typeof a.state !== "string" || !a.state.trim() || typeof a.postalCode !== "string" || !/^\d{6}$/.test(a.postalCode)) {
      return NextResponse.json({ ok: false, error: "Complete delivery address and 6-digit PIN code are required" }, { status: 400 });
    }
  }
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.productId !== "string" || !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return NextResponse.json({ ok: false, error: "One or more cart items are invalid" }, { status: 400 });
    }
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  if ([...quantities.values()].some(q => q > 20)) return NextResponse.json({ ok: false, error: "Maximum 20 units per product per order" }, { status: 400 });

  try {
    await connectToDatabase();
    const ids = [...quantities.keys()];
    const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
    if (products.length !== ids.length) return NextResponse.json({ ok: false, error: "A product is no longer available. Refresh your cart." }, { status: 409 });
    const orderItems = products.map(p => {
      const quantity = quantities.get(String(p._id))!;
      return { productId: p._id, name: p.name, image: p.image || "", unitPrice: p.price, quantity };
    });
    const unavailable = products.find(p => p.stock < (quantities.get(String(p._id)) || 0));
    if (unavailable) return NextResponse.json({ ok: false, error: unavailable.name + " does not have enough stock" }, { status: 409 });
    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const order = await Order.create({
      orderNumber: "PK" + Date.now().toString(36).toUpperCase() + randomBytes(3).toString("hex").toUpperCase(),
      customer: { name: customer.name.trim(), phone: customer.phone.trim(), ...(customer.email ? { email: customer.email.trim() } : {}) },
      fulfillmentMethod: method,
      ...(method === "delivery" ? { address: {
        line1: body.address.line1.trim(), line2: typeof body.address.line2 === "string" ? body.address.line2.trim() : "",
        city: body.address.city.trim(), state: body.address.state.trim(), postalCode: body.address.postalCode,
      } } : {}),
      items: orderItems, subtotal, deliveryFee: 0, total: subtotal,
      paymentMethod: method === "delivery" ? "cash-on-delivery" : "pay-at-store",
      customerNote: typeof body.customerNote === "string" ? body.customerNote.slice(0, 500) : "",
    });
    return NextResponse.json({ ok: true, order: { orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, subtotal: order.subtotal, total: order.total, createdAt: order.createdAt } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Order service is temporarily unavailable" }, { status: 503 });
  }
}
