import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ShippingSettings from "@/models/ShippingSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postalCode = typeof body?.postalCode === "string" ? body.postalCode.trim() : "";
    const subtotal = Number(body?.subtotal);
    if (!/^\d{6}$/.test(postalCode) || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ ok: false, error: "Enter a valid 6-digit PIN code" }, { status: 400 });
    }
    await connectToDatabase();
    const settings = await ShippingSettings.findOne({ key: "default" }).lean();
    const zone = settings?.zones?.find((z: any) => z.active && z.pincodes.includes(postalCode));
    if (settings?.zones?.some((z: any) => z.pincodes.includes(postalCode) && !z.active) && !zone) {
      return NextResponse.json({ ok: false, error: "Home delivery is currently unavailable for this PIN code" }, { status: 404 });
    }
    if (!zone && settings?.defaultEnabled === false) {
      return NextResponse.json({ ok: false, error: "We do not deliver to this PIN code yet. Please choose store pickup." }, { status: 404 });
    }
    const fee = zone ? zone.fee : (settings?.defaultFee ?? 0);
    const freeAbove = zone ? zone.freeAbove : (settings?.defaultFreeAbove ?? 0);
    const deliveryFee = freeAbove > 0 && subtotal >= freeAbove ? 0 : fee;
    return NextResponse.json({ ok: true, deliveryFee, zoneName: zone?.name || "Standard delivery", freeAbove, freeDelivery: deliveryFee === 0 });
  } catch (error) {
    console.error("POST /api/shipping/quote failed:", error);
    return NextResponse.json({ ok: false, error: "Shipping quote is temporarily unavailable" }, { status: 503 });
  }
}
