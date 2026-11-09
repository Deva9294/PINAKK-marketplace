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

// Conservative indicative retail estimates in INR, based on public Indian retail listings.
// These are planning prices, not supplier quotations or verified shop selling prices.
function estimatePrice(category: string, name: string): number {
  const n = name.toLowerCase();
  if (category === "Stationery") {
    if (/geometry box/.test(n)) return 85;
    if (/stapler|punch machine/.test(n)) return 65;
    if (/poster colour|water colour|acrylic colour|oil pastel/.test(n)) return 75;
    if (/sketch pen|brush pen|calligraphy|highlighter|marker/.test(n)) return 25;
    if (/ball pen|gel pen|ink pen|fountain pen|roller pen|refill pen/.test(n)) return 10;
    if (/pencil/.test(n)) return 5;
    if (/eraser|sharpener/.test(n)) return 5;
    if (/scale|ruler|divider|protractor|set square|compass/.test(n)) return 15;
    if (/glue|fevicol|gum|adhesive/.test(n)) return 30;
    if (/scissors|cutter/.test(n)) return 35;
    if (/file|folder/.test(n)) return 20;
    if (/chart paper|drawing sheet|craft paper|glitter sheet/.test(n)) return 15;
    if (/pencil box|exam pad/.test(n)) return 65;
    if (/stapler pin|paper clip|binder clip|tape/.test(n)) return 20;
    return 30;
  }
  if (category === "Copy & Notebook") {
    const pages = n.match(/(40|80|100|120|160|200|300)\s*pages?/);
    if (pages) return ({40:15,80:25,100:30,120:35,160:45,200:55,300:85} as Record<number,number>)[Number(pages[1])] || 35;
    if (/ledger|attendance register|cash book|stock register/.test(n)) return 120;
    if (/bill book|receipt book|voucher book/.test(n)) return 45;
    if (/diary/.test(n)) return 80;
    if (/a4 notebook/.test(n)) return 65;
    return 40;
  }
  if (category === "School Courses & Books") {
    if (/pariksha bodh|question bank|guide book|solved paper/.test(n)) return 150;
    if (/model paper|sample paper|practice set|previous year/.test(n)) return 60;
    if (/lab manual|workbook|exemplar/.test(n)) return 100;
    return 90;
  }
  if (category === "General Items") {
    if (/water bottle|lunch box|tiffin|flask/.test(n)) return 149;
    if (/charger|extension board|torch|led bulb|earphones|cable/.test(n)) return 149;
    if (/bag|storage box|containers|water jug|basket/.test(n)) return 199;
    if (/toy|doll|puzzle|building blocks/.test(n)) return 149;
    if (/umbrella|raincoat/.test(n)) return 199;
    if (/wallet|watch|sunglasses/.test(n)) return 199;
    if (/broom|mop|brush|duster|cloth/.test(n)) return 59;
    return 99;
  }
  if (category === "Perfume & Fragrance") {
    if (/gift set|oud/.test(n)) return 399;
    if (/10ml|pocket|roll-on|attar/.test(n)) return 99;
    if (/body spray|deodorant|body mist/.test(n)) return 149;
    return 249;
  }
  if (category === "Belt & Fashion Accessories") {
    if (/watch|sunglasses/.test(n)) return 299;
    if (/leather belt|automatic buckle/.test(n)) return 299;
    if (/wallet/.test(n)) return 199;
    if (/card holder|keychain|socks|handkerchief/.test(n)) return 49;
    return 149;
  }
  if (category === "Net Products") return 8; // indicative starting rate per sq ft; mesh/GSM changes final quote
  if (category === "Tirpal & Tarpaulin") return 4.5; // indicative starting rate per sq ft; GSM/material changes final quote
  return 99;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (body?.confirm !== "APPLY_PINAKK_INDICATIVE_PRICES_AND_ILLUSTRATIONS") {
    return NextResponse.json({ ok: false, error: "Explicit catalogue update confirmation is required" }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const updates = catalogueCategories.flatMap(category => category.items.map(name => {
      const slug = category.slug + "-" + slugify(name);
      const price = estimatePrice(category.name, name);
      const isCustom = category.slug === "net-products" || category.slug === "tirpal-tarpaulin";
      return { updateOne: {
        filter: { slug, price: { $in: [0, null] } },
        update: { $set: {
          price,
          description: name + " from PINAKK. Indicative online-market reference price: ₹" + price + (isCustom ? " per sq ft starting estimate; final price depends on size, GSM, mesh and material." : " estimated per item; actual brand, pack size and edition may change the price.") + " Illustration image is for catalogue display; confirm exact specification and local selling price before accepting orders.",
          ...(isCustom ? { customDimensions: { enabled: true, unit: "sq ft" as const, pricePerUnit: price } } : {})
        }, $addToSet: { tags: { $each: [name, category.name, "indicative-price", "illustration-image", "verify-before-sale"] } } },
      }};
    }));
    const result = await Product.bulkWrite(updates, { ordered: false });
    const imageUpdates = catalogueCategories.flatMap(category => category.items.map(name => {
      const slug = category.slug + "-" + slugify(name);
      return { updateOne: {
        filter: { slug, $or: [{ image: "" }, { image: null }, { image: { $exists: false } }] },
        update: { $set: { image: "/api/catalogue/illustration/" + slug } }
      }};
    }));
    const imageResult = await Product.bulkWrite(imageUpdates, { ordered: false });
    const launchUpdates = catalogueCategories.flatMap(category => category.items.map(name => ({
      updateOne: {
        filter: { slug: category.slug + "-" + slugify(name) },
        update: {
          $set: { active: true, stock: 20 },
          $addToSet: { tags: { $each: ["temporary-stock-20", "launch-catalogue", "availability-confirmation"] } }
        }
      }
    })));
    const launchResult = await Product.bulkWrite(launchUpdates, { ordered: false });
    const total = await Product.countDocuments({ slug: { $in: updates.map(x => x.updateOne.filter.slug) } });
    const stillMissingPrice = await Product.countDocuments({ slug: { $in: updates.map(x => x.updateOne.filter.slug) }, $or: [{ price: { $lte: 0 } }, { price: { $exists: false } }] });
    const missingImage = await Product.countDocuments({ slug: { $in: updates.map(x => x.updateOne.filter.slug) }, $or: [{ image: "" }, { image: { $exists: false } }] });
    return NextResponse.json({
      ok: true, matchedCatalogueRecords: total, pricesAdded: result.modifiedCount,
      illustrationsAdded: imageResult.modifiedCount, launchListingsActivated: launchResult.modifiedCount,
      stillMissingPrice, missingImage,
      published: await Product.countDocuments({ slug: { $in: updates.map(x => x.updateOne.filter.slug) }, active: true }),
      temporaryStockSetTo20: launchResult.modifiedCount,
      message: "Launch catalogue activated with indicative prices, illustrations and provisional stock 20. Availability must be confirmed by the store before dispatch."
    });
  } catch (error) {
    console.error("PINAKK indicative catalogue update failed:", error);
    return NextResponse.json({ ok: false, error: "Could not update catalogue. Check MongoDB connection." }, { status: 503 });
  }
}
