import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    const subtotal = Number(body?.subtotal);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ ok: false, error: "Enter a valid coupon code and order amount" }, { status: 400 });
    }
    await connectToDatabase();
    const coupon = await Coupon.findOne({ code, active: true }).lean();
    const now = new Date();
    if (!coupon || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) ||
        (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)) {
      return NextResponse.json({ ok: false, error: "This coupon is invalid, expired or fully used" }, { status: 404 });
    }
    if (subtotal < coupon.minSubtotal) {
      return NextResponse.json({ ok: false, error: `Minimum order value is ₹${coupon.minSubtotal}` }, { status: 400 });
    }
    const raw = coupon.discountType === "percentage" ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
    const discount = Math.min(subtotal, coupon.maxDiscount > 0 ? Math.min(raw, coupon.maxDiscount) : raw);
    return NextResponse.json({ ok: true, coupon: { code: coupon.code, description: coupon.description }, discount: Math.round(discount * 100) / 100, total: Math.max(0, Math.round((subtotal - discount) * 100) / 100) });
  } catch (error) {
    console.error("POST /api/coupons/validate failed:", error);
    return NextResponse.json({ ok: false, error: "Coupon service is temporarily unavailable" }, { status: 503 });
  }
}
