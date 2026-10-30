import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(request: NextRequest) {
  const expected = process.env.PINAKK_ADMIN_API_KEY;
  const supplied = request.headers.get("x-admin-api-key");
  return Boolean(expected && supplied && supplied.length === expected.length &&
    Buffer.from(supplied).equals(Buffer.from(expected)));
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!mongoose.isValidObjectId(context.params.id)) return NextResponse.json({ ok: false, error: "Invalid product ID" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ ok: false, error: "Invalid product fields" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = ["name", "slug", "category", "description", "price", "compareAtPrice", "image", "stock", "active"];
  if (Object.keys(input).length === 0 || Object.keys(input).some(key => !allowed.includes(key))) {
    return NextResponse.json({ ok: false, error: "Empty or unsupported product fields" }, { status: 400 });
  }
  if (("name" in input && (typeof input.name !== "string" || !input.name.trim() || input.name.length > 160)) ||
      ("slug" in input && (typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))) ||
      ("category" in input && (typeof input.category !== "string" || !input.category.trim() || input.category.length > 80)) ||
      ("description" in input && (typeof input.description !== "string" || input.description.length > 2000)) ||
      (["price", "compareAtPrice"].some(k => k in input && (typeof input[k] !== "number" || !Number.isFinite(input[k]) || (input[k] as number) < 0))) ||
      ("stock" in input && (typeof input.stock !== "number" || !Number.isInteger(input.stock) || input.stock < 0)) ||
      ("image" in input && typeof input.image !== "string") ||
      ("active" in input && typeof input.active !== "boolean")) {
    return NextResponse.json({ ok: false, error: "Product fields are invalid" }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(context.params.id, { $set: input }, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error("PATCH /api/products failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update product" }, { status: 500 });
  }
}
