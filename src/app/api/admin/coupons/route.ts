import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ ok: true, coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load coupons" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    const discountType = body?.discountType;
    const discountValue = Number(body?.discountValue);
    const minSubtotal = Number(body?.minSubtotal || 0);
    const maxDiscount = Number(body?.maxDiscount || 0);
    const usageLimit = Number(body?.usageLimit || 0);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code) || !["percentage", "fixed"].includes(discountType) ||
        !Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percentage" && discountValue > 100) ||
        !Number.isFinite(minSubtotal) || minSubtotal < 0 || !Number.isFinite(maxDiscount) || maxDiscount < 0 ||
        !Number.isInteger(usageLimit) || usageLimit < 0) {
      return NextResponse.json({ ok: false, error: "Coupon details are invalid" }, { status: 400 });
    }
    await connectToDatabase();
    const coupon = await Coupon.create({
      code, description: typeof body.description === "string" ? body.description.slice(0, 180) : "",
      discountType, discountValue, minSubtotal, maxDiscount, usageLimit,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, coupon }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ ok: false, error: "Coupon code already exists" }, { status: 409 });
    console.error("POST /api/admin/coupons failed:", error);
    return NextResponse.json({ ok: false, error: "Could not create coupon" }, { status: 503 });
  }
}
