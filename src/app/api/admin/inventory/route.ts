import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const LOW_STOCK_THRESHOLD = 5;

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const [lowStock, outOfStock, movements] = await Promise.all([
      Product.find({ active: true, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1, name: 1 }).limit(200).lean(),
      Product.find({ active: true, stock: 0 }).sort({ name: 1 }).limit(200).lean(),
      StockMovement.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);
    return NextResponse.json({ ok: true, threshold: LOW_STOCK_THRESHOLD, lowStock, outOfStock, movements });
  } catch (error) {
    console.error("GET /api/admin/inventory failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load inventory" }, { status: 503 });
  }
}
