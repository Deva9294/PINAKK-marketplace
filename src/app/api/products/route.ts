import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validProduct(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  const validTextArray = (v: unknown, maxItems: number, maxLength: number) =>
    v === undefined || (Array.isArray(v) && v.length <= maxItems && v.every(x => typeof x === "string" && x.length <= maxLength));
  const validSpecs = (v: unknown) => v === undefined || (
    !!v && typeof v === "object" && !Array.isArray(v) &&
    Object.entries(v as Record<string, unknown>).length <= 40 &&
    Object.entries(v as Record<string, unknown>).every(([k, val]) => k.length <= 60 && typeof val === "string" && val.length <= 250)
  );
  return typeof p.name === "string" && p.name.trim().length > 0 && p.name.length <= 160 &&
    typeof p.slug === "string" && p.slug.length <= 180 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) &&
    typeof p.category === "string" && p.category.trim().length > 0 && p.category.length <= 80 &&
    typeof p.description === "string" && p.description.length <= 5000 &&
    typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0 &&
    (p.compareAtPrice === undefined || (typeof p.compareAtPrice === "number" && Number.isFinite(p.compareAtPrice) && p.compareAtPrice >= 0)) &&
    typeof p.stock === "number" && Number.isInteger(p.stock) && p.stock >= 0 &&
    (p.image === undefined || (typeof p.image === "string" && p.image.length <= 2000)) &&
    (p.sku === undefined || (typeof p.sku === "string" && p.sku.length <= 80)) &&
    (p.brand === undefined || (typeof p.brand === "string" && p.brand.length <= 100)) &&
    (p.subcategory === undefined || (typeof p.subcategory === "string" && p.subcategory.length <= 100)) &&
    validTextArray(p.images, 12, 2000) && validTextArray(p.tags, 30, 60) && validSpecs(p.specifications) &&
    (p.active === undefined || typeof p.active === "boolean");
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const params = request.nextUrl.searchParams;
    const includeInactive = params.get("all") === "1" && await isAdminRequest(request);
    const filter: Record<string, any> = includeInactive ? {} : { active: true };
    const category = params.get("category")?.trim();
    const brand = params.get("brand")?.trim();
    const search = params.get("q")?.trim();
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");

    if (category && category.length <= 80 && category !== "All") filter.category = category;
    if (brand && brand.length <= 100) filter.brand = brand;
    if (search && search.length <= 100) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { brand: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
      ];
    }

    const price: Record<string, number> = {};
    if (minPrice && Number.isFinite(Number(minPrice)) && Number(minPrice) >= 0) price.$gte = Number(minPrice);
    if (maxPrice && Number.isFinite(Number(maxPrice)) && Number(maxPrice) >= 0) price.$lte = Number(maxPrice);
    if (Object.keys(price).length) filter.price = price;

    const page = Math.max(1, Math.min(100000, Number(params.get("page")) || 1));
    const limit = Math.max(1, Math.min(100, Number(params.get("limit")) || 100));
    const sortKey = params.get("sort");
    const sort: Record<string, 1 | -1> =
      sortKey === "price-low" ? { price: 1 } :
      sortKey === "price-high" ? { price: -1 } :
      sortKey === "oldest" ? { createdAt: 1 } :
      { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return NextResponse.json({
      ok: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
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
    if (duplicate) return NextResponse.json({ ok: false, error: "A product with this SKU or slug already exists" }, { status: 409 });
    console.error("POST /api/products failed:", error);
    return NextResponse.json({ ok: false, error: "Could not create product" }, { status: 500 });
  }
}
