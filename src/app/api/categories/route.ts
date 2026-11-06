import { NextResponse } from "next/server";
import { catalogueCategories, schoolCourseOptions, copyNotebookFilters, netTarpaulinOptions } from "@/lib/catalogue";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    ok: true,
    categories: catalogueCategories,
    schoolCourseOptions,
    copyNotebookFilters,
    netTarpaulinOptions
  }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
  });
}
