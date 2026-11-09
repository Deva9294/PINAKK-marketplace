import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import { catalogueCategories, schoolCourseOptions, copyNotebookFilters, netTarpaulinOptions } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validCategory(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && v.name.trim().length > 0 && v.name.length <= 80 &&
    typeof v.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug) && v.slug.length <= 100 &&
    (v.description === undefined || (typeof v.description === "string" && v.description.length <= 1000)) &&
    (v.image === undefined || (typeof v.image === "string" && v.image.length <= 2000)) &&
    (v.icon === undefined || (typeof v.icon === "string" && v.icon.length <= 60)) &&
    (v.subcategories === undefined || (Array.isArray(v.subcategories) && v.subcategories.length <= 100 && v.subcategories.every(x => typeof x === "string" && x.length <= 100))) &&
    (v.items === undefined || (Array.isArray(v.items) && v.items.length <= 200 && v.items.every(x => typeof x === "string" && x.length <= 120))) &&
    (v.filters === undefined || (Array.isArray(v.filters) && v.filters.length <= 50 && v.filters.every(x => typeof x === "string" && x.length <= 120))) &&
    (v.seoTitle === undefined || (typeof v.seoTitle === "string" && v.seoTitle.length <= 180)) &&
    (v.seoDescription === undefined || (typeof v.seoDescription === "string" && v.seoDescription.length <= 320)) &&
    (v.active === undefined || typeof v.active === "boolean") &&
    (v.displayOrder === undefined || (typeof v.displayOrder === "number" && Number.isInteger(v.displayOrder) && v.displayOrder >= 0));
}

async function seedDefaults() {
  // Add only missing default categories. Never overwrite categories edited by the admin.
  await Category.bulkWrite(
    catalogueCategories.map(category => ({
      updateOne: {
        filter: { slug: category.slug },
        update: { $setOnInsert: category },
        upsert: true
      }
    })),
    { ordered: false }
  );
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await seedDefaults();
    const includeInactive = request.nextUrl.searchParams.get("all") === "1" && await isAdminRequest(request);
    const categories = await Category.find(includeInactive ? {} : { active: true }).sort({ displayOrder: 1, name: 1 }).lean();
    return NextResponse.json({ ok: true, categories, schoolCourseOptions, copyNotebookFilters, netTarpaulinOptions });
  } catch (error) {
    console.error("GET /api/categories failed:", error);
    return NextResponse.json({ ok: true, categories: catalogueCategories, schoolCourseOptions, copyNotebookFilters, netTarpaulinOptions, source: "defaults" });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (!validCategory(body)) return NextResponse.json({ ok: false, error: "Category fields are invalid" }, { status: 400 });
  try {
    await connectToDatabase();
    const category = await Category.create(body);
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    return NextResponse.json({ ok: false, error: duplicate ? "Category name or slug already exists" : "Could not create category" }, { status: duplicate ? 409 : 500 });
  }
}
