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

class CheckoutError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "CheckoutError";
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }

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
    const address = body.address;
    if (!address || typeof address.line1 !== "string" || address.line1.trim().length < 5 ||
        typeof address.city !== "string" || !address.city.trim() ||
        typeof address.state !== "string" || !address.state.trim() ||
        typeof address.postalCode !== "string" || !/^\d{6}$/.test(address.postalCode)) {
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
  if ([...quantities.values()].some(quantity => quantity > 20)) {
    return NextResponse.json({ ok: false, error: "Maximum 20 units per product per order" }, { status: 400 });
  }

  let dbSession: mongoose.ClientSession | null = null;
  let createdOrder: any = null;
  try {
    await connectToDatabase();
    const auth = await readUserSession(request);
    dbSession = await mongoose.startSession();

    await dbSession.withTransaction(async () => {
      if (auth && auth.role !== "customer") {
        throw new CheckoutError("Customer account required to place an order", 403);
      }

      const account = auth
        ? await User.findById(auth.id).select("name phone email active").session(dbSession).lean() as
          { name: string; phone: string; email?: string; active: boolean } | null
        : null;
      if (auth && (!account || !account.active)) {
        throw new CheckoutError("Your customer account is unavailable", 401);
      }

      const savedCustomer = account
        ? { name: account.name, phone: account.phone, ...(account.email ? { email: account.email } : {}) }
        : {
            name: customer.name.trim(),
            phone: customer.phone.replace(/[\s-]/g, ""),
            ...(customer.email ? { email: customer.email.trim() } : {})
          };

      const ids = [...quantities.keys()];
      const products = await Product.find({ _id: { $in: ids }, active: true }).session(dbSession).lean();
      if (products.length !== ids.length) {
        throw new CheckoutError("A product is no longer available. Refresh your cart.", 409);
      }

      // Reserve every item and record its stock movement inside the same transaction.
      for (const id of ids) {
        const quantity = quantities.get(id)!;
        const before = await Product.findOneAndUpdate(
          { _id: id, active: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: false, projection: { name: 1, stock: 1 }, session: dbSession }
        ).lean();
        if (!before) {
          const name = products.find((product: any) => String(product._id) === id)?.name || "one item";
          throw new CheckoutError("Insufficient stock for " + name + ". Refresh your cart.", 409);
        }
        await StockMovement.create([{
          productId: id,
          productName: before.name,
          type: "sale",
          quantity: -quantity,
          beforeStock: before.stock,
          afterStock: before.stock - quantity,
          reference: "checkout",
          note: "Stock reserved for customer order"
        }], { session: dbSession });
      }

      const orderItems = products.map((product: any) => {
        const quantity = quantities.get(String(product._id))!;
        return {
          productId: product._id,
          name: product.name,
          image: product.image || "",
          unitPrice: product.price,
          gstRate: product.gstRate,
          hsnCode: product.hsnCode || "",
          quantity
        };
      });
      const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      let couponCode = "";
      let discount = 0;
      if (body.couponCode) {
        couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
        if (!/^[A-Z0-9_-]{3,32}$/.test(couponCode)) {
          throw new CheckoutError("Coupon code is invalid", 400);
        }
        const coupon = await Coupon.findOne({ code: couponCode, active: true }).session(dbSession);
        const now = new Date();
        if (!coupon || (coupon.startsAt && coupon.startsAt > now) ||
            (coupon.expiresAt && coupon.expiresAt < now) ||
            (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) ||
            subtotal < coupon.minSubtotal) {
          throw new CheckoutError("Coupon is no longer valid for this order", 409);
        }
        const rawDiscount = coupon.discountType === "percentage"
          ? subtotal * coupon.discountValue / 100
          : coupon.discountValue;
        discount = Math.round(Math.min(
          subtotal,
          coupon.maxDiscount > 0 ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount
        ) * 100) / 100;

        const claimed = await Coupon.findOneAndUpdate(
          {
            _id: coupon._id,
            active: true,
            $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }]
          },
          { $inc: { usedCount: 1 } },
          { new: true, session: dbSession }
        );
        if (!claimed) throw new CheckoutError("Coupon usage limit has been reached", 409);
      }

      let deliveryFee = 0;
      if (method === "delivery") {
        const settings = await ShippingSettings.findOne({ key: "default" }).session(dbSession).lean();
        const postalCode = body.address.postalCode;
        const matchingZone = settings?.zones?.find((zone: any) => zone.pincodes.includes(postalCode));
        if (matchingZone && !matchingZone.active) {
          throw new CheckoutError("Home delivery is currently unavailable for this PIN code", 400);
        }
        if (!matchingZone && settings?.defaultEnabled === false) {
          throw new CheckoutError("We do not deliver to this PIN code yet. Please choose store pickup.", 400);
        }
        const fee = matchingZone ? matchingZone.fee : (settings?.defaultFee ?? 0);
        const freeAbove = matchingZone ? matchingZone.freeAbove : (settings?.defaultFreeAbove ?? 0);
        deliveryFee = freeAbove > 0 && subtotal - discount >= freeAbove ? 0 : fee;
      }

      const invoiceSettings = await InvoiceSettings.findOne({ key: "default" }).session(dbSession).lean() ||
        { defaultGstRate: 0, pricesIncludeGst: true, invoicePrefix: "PIN" };
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
      const invoiceNumber = String(invoiceSettings.invoicePrefix || "PIN") + "-" +
        new Date().getFullYear() + "-" + Date.now().toString(36).toUpperCase();

      const [order] = await Order.create([{
        orderNumber: "PK" + Date.now().toString(36).toUpperCase() + randomBytes(3).toString("hex").toUpperCase(),
        invoiceNumber,
        taxableValue,
        taxTotal,
        pricesIncludeGst: invoiceSettings.pricesIncludeGst,
        ...(auth ? { customerUserId: auth.id } : {}),
        customer: savedCustomer,
        fulfillmentMethod: method,
        ...(method === "delivery" ? { address: {
          line1: body.address.line1.trim(),
          line2: typeof body.address.line2 === "string" ? body.address.line2.trim() : "",
          city: body.address.city.trim(),
          state: body.address.state.trim(),
          postalCode: body.address.postalCode
        } } : {}),
        items: orderItems,
        subtotal,
        deliveryFee,
        couponCode,
        discount,
        total: Math.max(0, subtotal - discount) + deliveryFee +
          (invoiceSettings.pricesIncludeGst ? 0 : taxTotal),
        paymentMethod: method === "delivery" ? "cash-on-delivery" : "pay-at-store",
        customerNote: typeof body.customerNote === "string" ? body.customerNote.slice(0, 500) : ""
      }], { session: dbSession });
      createdOrder = order;
    });

    if (!createdOrder) {
      return NextResponse.json({ ok: false, error: "Order could not be completed" }, { status: 503 });
    }
    return NextResponse.json({
      ok: true,
      order: {
        id: String(createdOrder._id),
        fulfillmentMethod: createdOrder.fulfillmentMethod,
        orderNumber: createdOrder.orderNumber,
        status: createdOrder.status,
        paymentStatus: createdOrder.paymentStatus,
        paymentMethod: createdOrder.paymentMethod,
        subtotal: createdOrder.subtotal,
        deliveryFee: createdOrder.deliveryFee,
        discount: createdOrder.discount,
        taxableValue: createdOrder.taxableValue,
        taxTotal: createdOrder.taxTotal,
        total: createdOrder.total,
        invoiceNumber: createdOrder.invoiceNumber,
        createdAt: createdOrder.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("POST /api/orders transaction failed:", error);
    return NextResponse.json({
      ok: false,
      error: "Order service is temporarily unavailable. Please retry; no order or stock change was committed."
    }, { status: 503 });
  } finally {
    if (dbSession) await dbSession.endSession();
  }
}
