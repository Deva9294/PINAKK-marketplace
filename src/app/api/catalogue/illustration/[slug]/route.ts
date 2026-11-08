import { NextRequest, NextResponse } from "next/server";
import { catalogueCategories } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
}
export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const category = catalogueCategories.find(c => c.items.some(item => c.slug + "-" + slugify(item) === slug));
  const item = category?.items.find(name => category.slug + "-" + slugify(name) === slug);
  if (!category || !item) return new NextResponse("Not found", { status: 404 });
  const palette: Record<string, [string,string]> = {
    "Stationery":["#eaf0ff","#1e40af"],"Copy & Notebook":["#e8f5ef","#147d55"],
    "School Courses & Books":["#fff1df","#c46a10"],"General Items":["#edf2f7","#475569"],
    "Perfume & Fragrance":["#f7eafa","#8746a5"],"Belt & Fashion Accessories":["#fcefe8","#a4512a"],
    "Net Products":["#e6f5f4","#147d7a"],"Tirpal & Tarpaulin":["#e8eef5","#34516f"]
  };
  const [bg,accent] = palette[category.name] || ["#edf2f7","#1e40af"];
  const title = esc(item.length > 35 ? item.slice(0,32)+"…" : item);
  const cat = esc(category.name.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" rx="48" fill="${bg}"/>
  <circle cx="450" cy="345" r="210" fill="#fff" opacity=".78"/>
  <g stroke="${accent}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="300" y="190" width="300" height="310" rx="34" fill="#fff"/>
    <path d="M350 270h200M350 325h200M350 380h145"/>
    <path d="M390 445l55 0" />
    <path d="M560 175l75 75M635 175l-75 75" opacity=".55"/>
  </g>
  <text x="450" y="625" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${accent}">${cat}</text>
  <text x="450" y="690" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#172033">${title}</text>
  <text x="450" y="755" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#667085">ILLUSTRATION • ACTUAL PRODUCT MAY VARY</text>
  <text x="450" y="820" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${accent}">PINAKK</text>
</svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
}
