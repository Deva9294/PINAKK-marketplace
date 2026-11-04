import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import ShippingSettings from "@/models/ShippingSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const settings = await ShippingSettings.findOne({ key: "default" }).lean();
    return NextResponse.json({ ok: true, settings: settings || { defaultEnabled: true, defaultFee: 0, defaultFreeAbove: 0, zones: [] } });
  } catch (error) {
    console.error("GET /api/admin/shipping failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load shipping settings" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const defaultFee = Number(body?.defaultFee);
    const defaultFreeAbove = Number(body?.defaultFreeAbove);
    if (typeof body?.defaultEnabled !== "boolean" || !Number.isFinite(defaultFee) || defaultFee < 0 ||
        !Number.isFinite(defaultFreeAbove) || defaultFreeAbove < 0 || !Array.isArray(body?.zones) || body.zones.length > 100) {
      return NextResponse.json({ ok: false, error: "Shipping settings are invalid" }, { status: 400 });
    }
    const zones = body.zones.map((z: any) => ({
      name: typeof z?.name === "string" ? z.name.trim().slice(0, 80) : "",
      pincodes: Array.isArray(z?.pincodes) ? [...new Set(z.pincodes.map((p: any) => String(p).trim()))] : [],
      fee: Number(z?.fee), freeAbove: Number(z?.freeAbove || 0), active: z?.active !== false,
    }));
    if (zones.some((z: any) => !z.name || !z.pincodes.length || z.pincodes.some((p: string) => !/^\\d{6}$/.test(p)) ||
        !Number.isFinite(z.fee) || z.fee < 0 || !Number.isFinite(z.freeAbove) || z.freeAbove < 0)) {
      return NextResponse.json({ ok: false, error: "Each zone needs a name, valid 6-digit PIN codes and non-negative charges" }, { status: 400 });
    }
    const allPins = zones.flatMap((z: any) => z.pincodes);
    if (new Set(allPins).size !== allPins.length) return NextResponse.json({ ok: false, error: "A PIN code cannot belong to multiple zones" }, { status: 400 });
    await connectToDatabase();
    const settings = await ShippingSettings.findOneAndUpdate({ key: "default" }, {
      $set: { defaultEnabled: body.defaultEnabled, defaultFee, defaultFreeAbove, zones },
      $setOnInsert: { key: "default" },
    }, { new: true, upsert: true, runValidators: true });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("PUT /api/admin/shipping failed:", error);
    return NextResponse.json({ ok: false, error: "Could not save shipping settings" }, { status: 503 });
  }
}
