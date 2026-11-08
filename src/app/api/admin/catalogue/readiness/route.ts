import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { catalogueCategories } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const expectedSlugs = catalogueCategories.flatMap(category =>
      category.items.map(item => category.slug + "-" + slugify(item))
    );
    const uniqueSlugs = [...new Set(expectedSlugs)];
    const products = await Product.find({ slug: { $in: uniqueSlugs } })
      .select("slug name category price image images stock active")
      .lean();

    const hasItemImage = (product: (typeof products)[number]) =>
      [product.image, ...(product.images || [])].some(image =>
        typeof image === "string" && image.trim().length > 0 &&
        !image.startsWith("/catalogue/category-")
      );

    const foundSlugs = new Set(products.map(product => product.slug));
    const missingPrice = products.filter(product => !(Number(product.price) > 0)).length;
    const missingImage = products.filter(product => !hasItemImage(product)).length;
    const stockNot20 = products.filter(product => Number(product.stock) !== 20).length;
    const published = products.filter(product => product.active === true).length;

    return NextResponse.json({
      ok: true,
      expectedItems: uniqueSlugs.length,
      found: products.length,
      missingRecords: uniqueSlugs.filter(slug => !foundSlugs.has(slug)).length,
      missingPrice,
      missingImage,
      stockNot20,
      published,
      readyToPublish: products.filter(product =>
        !product.active && Number(product.price) > 0 && hasItemImage(product) && Number(product.stock) > 0
      ).length,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("PINAKK catalogue readiness audit failed:", error);
    return NextResponse.json({ ok: false, error: "Could not audit catalogue. Check MongoDB connection." }, { status: 503 });
  }
}
