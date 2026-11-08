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
  const art: Record<string,string> = {
    "Stationery": `<path d="M350 450l170-250 70 48-170 250-88 42z" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M520 200l32-48 70 48-32 48" fill="${accent}"/><path d="M350 450l-18 90 88-42" fill="${accent}"/>`,
    "Copy & Notebook": `<rect x="300" y="180" width="300" height="340" rx="24" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M360 260h180M360 320h180M360 380h180M360 440h140" stroke="${accent}" stroke-width="14" stroke-linecap="round"/><path d="M350 180v340" stroke="${accent}" stroke-width="14"/>`,
    "School Courses & Books": `<path d="M270 260q100-55 180 10v250q-80-65-180-10z" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M630 260q-100-55-180 10v250q80-65 180-10z" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M450 270v250" stroke="${accent}" stroke-width="16"/>`,
    "General Items": `<path d="M280 280l170-90 170 90v210l-170 90-170-90z" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M280 280l170 95 170-95M450 375v205" stroke="${accent}" stroke-width="16"/>`,
    "Perfume & Fragrance": `<rect x="350" y="250" width="200" height="270" rx="38" fill="#fff" stroke="${accent}" stroke-width="18"/><rect x="400" y="190" width="100" height="65" rx="10" fill="${accent}"/><path d="M390 365h120" stroke="${accent}" stroke-width="15"/><circle cx="450" cy="420" r="28" fill="${accent}" opacity=".25"/>`,
    "Belt & Fashion Accessories": `<path d="M250 320h400v110H250z" fill="#fff" stroke="${accent}" stroke-width="18"/><rect x="395" y="285" width="110" height="180" rx="16" fill="${bg}" stroke="${accent}" stroke-width="18"/><rect x="425" y="330" width="50" height="90" rx="8" fill="none" stroke="${accent}" stroke-width="12"/>`,
    "Net Products": `<rect x="260" y="190" width="380" height="330" rx="18" fill="#fff" stroke="${accent}" stroke-width="16"/><path d="M320 190v330M380 190v330M440 190v330M500 190v330M560 190v330M620 190v330M260 245h380M260 300h380M260 355h380M260 410h380M260 465h380" stroke="${accent}" stroke-width="8" opacity=".75"/>`,
    "Tirpal & Tarpaulin": `<path d="M250 270l400-70-55 300-400 70z" fill="#fff" stroke="${accent}" stroke-width="18"/><path d="M250 270l345 230M650 200L250 570M350 252l-55 300M450 235l-55 300M550 217l-55 300" stroke="${accent}" stroke-width="10" opacity=".55"/>`
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <rect width="900" height="900" rx="48" fill="${bg}"/>
  <circle cx="450" cy="345" r="210" fill="#fff" opacity=".78"/>
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">${art[category.name] || ""}</g>
  <text x="450" y="625" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="${accent}">${cat}</text>
  <text x="450" y="690" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#172033">${title}</text>
  <text x="450" y="755" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#667085">ILLUSTRATION • ACTUAL PRODUCT MAY VARY</text>
  <text x="450" y="820" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="${accent}">PINAKK</text>
</svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
}
