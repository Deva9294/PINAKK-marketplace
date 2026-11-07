import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { catalogueCategories } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }

  if (body?.confirm !== "IMPORT_PINAKK_CATALOGUE_ITEMS_AS_DRAFTS") {
    return NextResponse.json({ ok: false, error: "Explicit import confirmation is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const candidates = catalogueCategories.flatMap(category =>
      category.items.map(item => ({
        name: item,
        slug: category.slug + "-" + slugify(item),
        category: category.name,
        description: item + " — catalogue draft. Add verified product photos, actual selling price, stock and specifications before publishing.",
        price: 0,
        stock: 0,
        image: "",
        tags: [item, category.name],
        active: false
      }))
    );
    const slugs = candidates.map(item => item.slug);
    const existing = await Product.find({ slug: { $in: slugs } }).select("slug").lean();
    const existingSlugs = new Set(existing.map(item => item.slug));
    const missing = candidates.filter(item => !existingSlugs.has(item.slug));
    if (missing.length) await Product.insertMany(missing, { ordered: false });

    return NextResponse.json({
      ok: true,
      categories: catalogueCategories.length,
      candidates: candidates.length,
      inserted: missing.length,
      alreadyPresent: candidates.length - missing.length,
      published: 0,
      message: "Catalogue items were saved as unpublished drafts. Enter actual prices, stock and item photos in Admin → Products, then publish each verified listing."
    });
  } catch (error) {
    console.error("PINAKK draft catalogue import failed:", error);
    return NextResponse.json({ ok: false, error: "Could not import catalogue drafts. Check MongoDB connection and unique indexes." }, { status: 503 });
  }
}
