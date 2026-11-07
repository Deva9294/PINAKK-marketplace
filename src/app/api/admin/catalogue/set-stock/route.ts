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

  if (body?.confirm !== "SET_PINAKK_CATALOGUE_STOCK_TO_20") {
    return NextResponse.json({ ok: false, error: "Explicit stock update confirmation is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const slugs = catalogueCategories.flatMap(category =>
      category.items.map(item => category.slug + "-" + slugify(item))
    );
    const filter = { slug: { $in: slugs } };
    const matched = await Product.countDocuments(filter);
    const result = await Product.updateMany(filter, { $set: { stock: 20 } });
    return NextResponse.json({
      ok: true,
      targetQuantity: 20,
      matched,
      modified: result.modifiedCount,
      message: "Catalogue stock values updated. These are test quantities; reconcile physical stock before real fulfilment."
    });
  } catch (error) {
    console.error("PINAKK bulk catalogue stock update failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update catalogue stock. Check MongoDB connection." }, { status: 503 });
  }
}
