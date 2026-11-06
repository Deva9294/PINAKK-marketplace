import { NextResponse } from "next/server";
import { catalogueCategories } from "@/lib/catalogue";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    { ok: true, categories: catalogueCategories, total: catalogueCategories.length },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
