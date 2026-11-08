import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid product id" }, { status: 400 });
  try {
    await connectToDatabase();
    const product = await Product.findOne({ _id: id, active: true }).lean();
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error("GET /api/products/[id] failed:", error);
    return NextResponse.json({ ok: false, error: "Product service is temporarily unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid product id" }, { status: 400 });
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const allowed = ["name", "slug", "sku", "category", "subcategory", "brand", "description", "price", "compareAtPrice", "gstRate", "hsnCode", "image", "images", "specifications", "tags", "stock", "active", "variants", "barcode", "weight", "size", "colour", "gsm", "material", "lowStockThreshold", "customDimensions", "schoolCourse", "seoTitle", "seoDescription"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) update[key] = body[key];
  if (!Object.keys(update).length) return NextResponse.json({ ok: false, error: "No editable product fields supplied" }, { status: 400 });
  if (typeof update.name === "string" && (!update.name.trim() || update.name.length > 160)) return NextResponse.json({ ok: false, error: "Invalid product name" }, { status: 400 });
  if (typeof update.slug === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(update.slug)) return NextResponse.json({ ok: false, error: "Invalid product slug" }, { status: 400 });
  if (typeof update.category === "string" && (!update.category.trim() || update.category.length > 80)) return NextResponse.json({ ok: false, error: "Invalid product category" }, { status: 400 });
  if (typeof update.price === "number" && (!Number.isFinite(update.price) || update.price < 0)) return NextResponse.json({ ok: false, error: "Invalid product price" }, { status: 400 });
  if (typeof update.gstRate === "number" && (!Number.isFinite(update.gstRate) || update.gstRate < 0 || update.gstRate > 100)) return NextResponse.json({ ok: false, error: "Invalid GST rate" }, { status: 400 });
  if (typeof update.hsnCode === "string" && update.hsnCode.length > 8) return NextResponse.json({ ok: false, error: "Invalid HSN code" }, { status: 400 });
  if (typeof update.stock === "number" && (!Number.isInteger(update.stock) || update.stock < 0)) return NextResponse.json({ ok: false, error: "Invalid product stock" }, { status: 400 });
  try {
    await connectToDatabase();
    if (update.active === true) {
      const current = await Product.findById(id).select("price image images").lean() as any;
      if (!current) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
      const nextPrice = typeof update.price === "number" ? update.price : current.price;
      const nextImage = typeof update.image === "string" ? update.image : current.image;
      const nextImages = Array.isArray(update.images) ? update.images : current.images;
      const hasItemImage = (typeof nextImage === "string" && nextImage.trim().length > 0 && !nextImage.startsWith("/catalogue/category-") && !nextImage.startsWith("/api/catalogue/illustration/")) ||
        (Array.isArray(nextImages) && nextImages.some((image: unknown) => typeof image === "string" && image.trim().length > 0 && !image.startsWith("/catalogue/category-") && !image.startsWith("/api/catalogue/illustration/")));
      if (!(nextPrice > 0)) return NextResponse.json({ ok: false, error: "Enter the actual selling price before publishing this product" }, { status: 400 });
      if (!hasItemImage) return NextResponse.json({ ok: false, error: "Add an item-specific product photo before publishing this product" }, { status: 400 });
    }
    const previous = typeof update.stock === "number"
      ? await Product.findById(id).select("name stock").lean()
      : null;
    const product = await Product.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    if (previous && previous.stock !== update.stock) {
      await StockMovement.create({
        productId: id, productName: previous.name, type: Number(update.stock) > previous.stock ? "restock" : "adjustment",
        quantity: Number(update.stock) - previous.stock, beforeStock: previous.stock, afterStock: Number(update.stock),
        reference: "admin", note: "Stock changed from admin product management"
      });
    }
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    if (duplicate) return NextResponse.json({ ok: false, error: "SKU or slug already exists" }, { status: 409 });
    console.error("PATCH /api/products/[id] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ ok: false, error: "Invalid product id" }, { status: 400 });
  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, message: "Product archived" });
  } catch (error) {
    console.error("DELETE /api/products/[id] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not archive product" }, { status: 500 });
  }
}
