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
  const hasItemImage = (typeof p.image === "string" && p.image.trim().length > 0 && !p.image.startsWith("/catalogue/category-")) || (Array.isArray(p.images) && p.images.some(x => typeof x === "string" && x.trim().length > 0 && !x.startsWith("/catalogue/category-")));
  return (p.active === false || (typeof p.price === "number" && p.price > 0 && hasItemImage)) && typeof p.name === "string" && p.name.trim().length > 0 && p.name.length <= 160 &&
    typeof p.slug === "string" && p.slug.length <= 180 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) &&
    typeof p.category === "string" && p.category.trim().length > 0 && p.category.length <= 80 &&
    typeof p.description === "string" && p.description.length <= 5000 &&
    typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0 &&
    (p.compareAtPrice === undefined || (typeof p.compareAtPrice === "number" && Number.isFinite(p.compareAtPrice) && p.compareAtPrice >= 0)) &&
    (p.gstRate === undefined || (typeof p.gstRate === "number" && Number.isFinite(p.gstRate) && p.gstRate >= 0 && p.gstRate <= 100)) &&
    (p.hsnCode === undefined || (typeof p.hsnCode === "string" && p.hsnCode.length <= 8)) &&
    typeof p.stock === "number" && Number.isInteger(p.stock) && p.stock >= 0 &&
    (p.image === undefined || (typeof p.image === "string" && p.image.length <= 2000)) &&
    (p.sku === undefined || (typeof p.sku === "string" && p.sku.length <= 80)) &&
    (p.brand === undefined || (typeof p.brand === "string" && p.brand.length <= 100)) &&
    (p.subcategory === undefined || (typeof p.subcategory === "string" && p.subcategory.length <= 100)) &&
    validTextArray(p.images, 12, 2000) && validTextArray(p.tags, 30, 60) && validSpecs(p.specifications) &&
    (p.variants === undefined || (Array.isArray(p.variants) && p.variants.length <= 100 && p.variants.every(v => !!v && typeof v === "object" && typeof (v as any).stock === "number" && Number.isInteger((v as any).stock) && (v as any).stock >= 0 && typeof (v as any).price === "number" && Number.isFinite((v as any).price) && (v as any).price >= 0))) &&
    (p.barcode === undefined || (typeof p.barcode === "string" && p.barcode.length <= 100)) &&
    (p.weight === undefined || (typeof p.weight === "number" && Number.isFinite(p.weight) && p.weight >= 0)) &&
    (p.gsm === undefined || (typeof p.gsm === "number" && Number.isFinite(p.gsm) && p.gsm >= 0)) &&
    (p.lowStockThreshold === undefined || (typeof p.lowStockThreshold === "number" && Number.isInteger(p.lowStockThreshold) && p.lowStockThreshold >= 0)) &&
    (p.customDimensions === undefined || (!!p.customDimensions && typeof p.customDimensions === "object" && typeof (p.customDimensions as any).enabled === "boolean" && ["sq ft","sq m"].includes((p.customDimensions as any).unit) && typeof (p.customDimensions as any).pricePerUnit === "number" && (p.customDimensions as any).pricePerUnit >= 0)) &&
    (p.schoolCourse === undefined || (!!p.schoolCourse && typeof p.schoolCourse === "object" && Object.values(p.schoolCourse as Record<string, unknown>).every(v => typeof v === "string" || typeof v === "boolean"))) &&
    (p.seoTitle === undefined || (typeof p.seoTitle === "string" && p.seoTitle.length <= 180)) &&
    (p.seoDescription === undefined || (typeof p.seoDescription === "string" && p.seoDescription.length <= 320)) &&
    (p.active === undefined || typeof p.active === "boolean");
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const params = request.nextUrl.searchParams;
    const includeInactive = params.get("all") === "1" && await isAdminRequest(request);
    const filter: Record<string, any> = includeInactive ? {} : { active: true };
    const idsParam = params.get("ids");
    if (idsParam) {
      const requestedIds = idsParam.split(",").map(id => id.trim()).filter(Boolean);
      if (requestedIds.length < 1 || requestedIds.length > 20 || requestedIds.some(id => !/^[a-f0-9]{24}$/i.test(id))) {
        return NextResponse.json({ ok: false, error: "Invalid product ID list" }, { status: 400 });
      }
      filter._id = { $in: [...new Set(requestedIds)] };
    }
    const category = params.get("category")?.trim();
    const brand = params.get("brand")?.trim();
    const courseFields = ["board","className","medium","stream","session","subject","bookType"] as const;
    for (const field of courseFields) {
      const value = params.get(field)?.trim();
      if (value && value.length <= 100) filter["schoolCourse."+field] = value;
    }
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
        { subcategory: { $regex: escaped, $options: "i" } },
        { sku: { $regex: escaped, $options: "i" } },
        { barcode: { $regex: escaped, $options: "i" } },
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
