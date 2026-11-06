import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ ok: false, error: "Invalid category id" }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  const allowed = ["name","slug","description","image","icon","subcategories","items","filters","courseOptions","customPricing","seoTitle","seoDescription","active","displayOrder"];
  const update = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(update).length) return NextResponse.json({ ok: false, error: "No supported fields supplied" }, { status: 400 });
  if (update.name !== undefined && (typeof update.name !== "string" || !update.name.trim() || update.name.length > 80)) return NextResponse.json({ ok: false, error: "Invalid category name" }, { status: 400 });
  if (update.slug !== undefined && (typeof update.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(update.slug))) return NextResponse.json({ ok: false, error: "Invalid category slug" }, { status: 400 });
  if (update.subcategories !== undefined && (!Array.isArray(update.subcategories) || update.subcategories.length > 100 || !update.subcategories.every(x => typeof x === "string" && x.length <= 100))) return NextResponse.json({ ok: false, error: "Invalid subcategories" }, { status: 400 });
  if (update.items !== undefined && (!Array.isArray(update.items) || update.items.length > 200 || !update.items.every(x => typeof x === "string" && x.length <= 120))) return NextResponse.json({ ok: false, error: "Invalid category items" }, { status: 400 });
  if (update.filters !== undefined && (!Array.isArray(update.filters) || update.filters.length > 50 || !update.filters.every(x => typeof x === "string" && x.length <= 120))) return NextResponse.json({ ok: false, error: "Invalid category filters" }, { status: 400 });
  try {
    await connectToDatabase();
    const category = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!category) return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
    return NextResponse.json({ ok: true, category });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json({ ok: false, error: duplicate ? "Category name or slug already exists" : "Could not update category" }, { status: duplicate ? 409 : 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ ok: false, error: "Invalid category id" }, { status: 400 });
  try {
    await connectToDatabase();
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
    const activeProducts = await Product.countDocuments({ category: category.name, active: true });
    if (activeProducts > 0) return NextResponse.json({ ok: false, error: "Reassign or archive active products before deleting this category", activeProducts }, { status: 409 });
    await Category.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/categories failed:", error);
    return NextResponse.json({ ok: false, error: "Could not delete category" }, { status: 500 });
  }
}
