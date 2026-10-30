import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function validProduct(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  return typeof p.name === "string" && p.name.trim().length > 0 && p.name.length <= 160 &&
    typeof p.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) &&
    typeof p.category === "string" && p.category.trim().length > 0 && p.category.length <= 80 &&
    typeof p.description === "string" && p.description.length <= 2000 &&
    typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0 &&
    typeof p.stock === "number" && Number.isInteger(p.stock) && p.stock >= 0 &&
    (p.image === undefined || typeof p.image === "string") &&
    (p.active === undefined || typeof p.active === "boolean");
}

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find({ active: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ ok: false, error: "Product service is temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (!validProduct(body)) return NextResponse.json({ ok: false, error: "Product fields are invalid" }, { status: 400 });
  try {
    await connectToDatabase();
    const product = await Product.create(body);
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    if (duplicate) return NextResponse.json({ ok: false, error: "A product with this slug already exists" }, { status: 409 });
    console.error("POST /api/products failed:", error);
    return NextResponse.json({ ok: false, error: "Could not create product" }, { status: 500 });
  }
}
