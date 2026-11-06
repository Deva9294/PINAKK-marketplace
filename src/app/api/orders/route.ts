import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { readUserSession } from "@/lib/user-auth";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import ShippingSettings from "@/models/ShippingSettings";
import InvoiceSettings from "@/models/InvoiceSettings";
import StockMovement from "@/models/StockMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RequestedItem = { productId: string; quantity: number };

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }

  const customer = body?.customer;
  const method = body?.fulfillmentMethod;
  const paymentMethod = "cash"; // Online payments are temporarily disabled; COD / pay-at-store only.
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
  if ([...quantities.values()].some(q => q > 20)) {
    return NextResponse.json({ ok: false, error: "Maximum 20 units per product per order" }, { status: 400 });
  }

  const reserved: Array<{ id: string; quantity: number }> = [];
  let reservedCouponId: string | null = null;
  async function releaseStock() {
    for (const item of reserved) {
      await Product.updateOne({ _id: item.id }, { $inc: { stock: item.quantity } });
    }
    reserved.length = 0;
  }

  try {
    await connectToDatabase();
    const session = await readUserSession(request);
    if (session && session.role !== "customer") {
      return NextResponse.json({ ok: false, error: "Customer account required to place an order" }, { status: 403 });
    }
    const account = session ? await User.findById(session.id).select("name phone email active").lean() as
      { name: string; phone: string; email?: string; active: boolean } | null : null;
    if (session && (!account || !account.active)) {
      return NextResponse.json({ ok: false, error: "Your customer account is unavailable" }, { status: 401 });
    }
    const savedCustomer = account
      ? { name: account.name, phone: account.phone, ...(account.email ? { email: account.email } : {}) }
      : { name: customer.name.trim(), phone: customer.phone.replace(/[\s-]/g, ""), ...(customer.email ? { email: customer.email.trim() } : {}) };

    const ids = [...quantities.keys()];
    const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
    if (products.length !== ids.length) {
      return NextResponse.json({ ok: false, error: "A product is no longer available. Refresh your cart." }, { status: 409 });
    }

    // Atomically reserve stock to prevent simultaneous orders overselling the same item.
    for (const id of ids) {
      const quantity = quantities.get(id)!;
      const before = await Product.findOneAndUpdate(
        { _id: id, active: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: false, projection: { name: 1, stock: 1 } }
      ).lean();
      if (!before) {
        await releaseStock();
        return NextResponse.json({ ok: false, error: "Insufficient stock for " + (products.find(p => String(p._id) === id)?.name || "one item") + ". Refresh your cart." }, { status: 409 });
      }
      reserved.push({ id, quantity });
      await StockMovement.create({
        productId: id, productName: before.name, type: "sale", quantity: -quantity,
        beforeStock: before.stock, afterStock: before.stock - quantity,
        reference: "checkout", note: "Stock reserved for customer order"
      });
    }

    const orderItems = products.map(p => {
      const quantity = quantities.get(String(p._id))!;
      return { productId: p._id, name: p.name, image: p.image || "", unitPrice: p.price, gstRate: (p as any).gstRate, hsnCode: (p as any).hsnCode || "", quantity };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let couponCode = "";
    let discount = 0;
    if (body.couponCode) {
      couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
      if (!/^[A-Z0-9_-]{3,32}$/.test(couponCode)) {
        await releaseStock();
        return NextResponse.json({ ok: false, error: "Coupon code is invalid" }, { status: 400 });
      }
      const coupon = await Coupon.findOne({ code: couponCode, active: true });
      const now = new Date();
      if (!coupon || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) ||
          (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) || subtotal < coupon.minSubtotal) {
        await releaseStock();
        return NextResponse.json({ ok: false, error: "Coupon is no longer valid for this order" }, { status: 409 });
      }
      const rawDiscount = coupon.discountType === "percentage" ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
      discount = Math.round(Math.min(subtotal, coupon.maxDiscount > 0 ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount) * 100) / 100;
      const claimed = await Coupon.findOneAndUpdate(
        { _id: coupon._id, active: true, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        { $inc: { usedCount: 1 } }, { new: true }
      );
      if (!claimed) {
        await releaseStock();
        return NextResponse.json({ ok: false, error: "Coupon usage limit has been reached" }, { status: 409 });
      }
      reservedCouponId = String(coupon._id);
    }
    let deliveryFee = 0;
    if (method === "delivery") {
      const settings = await ShippingSettings.findOne({ key: "default" }).lean();
      const postalCode = body.address.postalCode;
      const matchingZone = settings?.zones?.find((z: any) => z.pincodes.includes(postalCode));
      if (matchingZone && !matchingZone.active) {
        await releaseStock();
        if (reservedCouponId) { await Coupon.updateOne({ _id: reservedCouponId }, { $inc: { usedCount: -1 } }); reservedCouponId = null; }
        return NextResponse.json({ ok: false, error: "Home delivery is currently unavailable for this PIN code" }, { status: 400 });
      }
      if (!matchingZone && settings?.defaultEnabled === false) {
        await releaseStock();
        if (reservedCouponId) { await Coupon.updateOne({ _id: reservedCouponId }, { $inc: { usedCount: -1 } }); reservedCouponId = null; }
        return NextResponse.json({ ok: false, error: "We do not deliver to this PIN code yet. Please choose store pickup." }, { status: 400 });
      }
      const fee = matchingZone ? matchingZone.fee : (settings?.defaultFee ?? 0);
      const freeAbove = matchingZone ? matchingZone.freeAbove : (settings?.defaultFreeAbove ?? 0);
      deliveryFee = freeAbove > 0 && subtotal - discount >= freeAbove ? 0 : fee;
    }
    const invoiceSettings = await InvoiceSettings.findOne({ key: "default" }).lean() || { defaultGstRate: 0, pricesIncludeGst: true, invoicePrefix: "PIN" };
    let taxableValue = 0;
    let taxTotal = 0;
    for (const item of orderItems) {
      const gross = item.unitPrice * item.quantity;
      const net = Math.max(0, gross - (subtotal > 0 ? discount * gross / subtotal : 0));
      const rate = item.gstRate ?? Number(invoiceSettings.defaultGstRate || 0);
      const taxable = invoiceSettings.pricesIncludeGst ? net / (1 + rate / 100) : net;
      const tax = invoiceSettings.pricesIncludeGst ? net - taxable : taxable * rate / 100;
      taxableValue += taxable;
      taxTotal += tax;
    }
    taxableValue = Math.round(taxableValue * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const invoiceNumber = String(invoiceSettings.invoicePrefix || "PIN") + "-" + new Date().getFullYear() + "-" + Date.now().toString(36).toUpperCase();
    const order = await Order.create({
      orderNumber: "PK" + Date.now().toString(36).toUpperCase() + randomBytes(3).toString("hex").toUpperCase(),
      invoiceNumber, taxableValue, taxTotal, pricesIncludeGst: invoiceSettings.pricesIncludeGst,
      ...(session ? { customerUserId: session.id } : {}),
      customer: savedCustomer,
      fulfillmentMethod: method,
      ...(method === "delivery" ? { address: {
        line1: body.address.line1.trim(), line2: typeof body.address.line2 === "string" ? body.address.line2.trim() : "",
        city: body.address.city.trim(), state: body.address.state.trim(), postalCode: body.address.postalCode,
      } } : {}),
      items: orderItems, subtotal, deliveryFee, couponCode, discount, total: Math.max(0, subtotal - discount) + deliveryFee + (invoiceSettings.pricesIncludeGst ? 0 : taxTotal),
      paymentMethod: method === "delivery" ? "cash-on-delivery" : "pay-at-store",
      customerNote: typeof body.customerNote === "string" ? body.customerNote.slice(0, 500) : "",
    });
    reserved.length = 0; // Stock is now committed to the saved order.
    reservedCouponId = null; // Coupon usage is committed with the saved order.
    return NextResponse.json({ ok: true, order: { id: String(order._id), fulfillmentMethod: order.fulfillmentMethod, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, subtotal: order.subtotal, deliveryFee: order.deliveryFee, discount: order.discount, taxableValue: order.taxableValue, taxTotal: order.taxTotal, total: order.total, invoiceNumber: order.invoiceNumber, createdAt: order.createdAt } }, { status: 201 });
  } catch (error) {
    try { await releaseStock(); } catch (rollbackError) { console.error("Order stock rollback failed:", rollbackError); }
    if (reservedCouponId) { try { await Coupon.updateOne({ _id: reservedCouponId }, { $inc: { usedCount: -1 } }); } catch (rollbackError) { console.error("Coupon usage rollback failed:", rollbackError); } }
    console.error("POST /api/orders failed:", error);
    return NextResponse.json({ ok: false, error: "Order service is temporarily unavailable" }, { status: 503 });
  }
}
