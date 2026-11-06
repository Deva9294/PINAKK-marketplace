import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mapping: Record<string,string> = {
  "Stationery & School Supplies": "Stationery",
  "Paper & Printing Supplies": "Stationery",
  "Paper & Printing": "Stationery",
  "Glossy Paper": "Stationery",
  "Office Supplies": "Stationery",
  "Pens & Writing": "Stationery",
  "School Essentials": "Stationery",
  "Art & Craft": "Stationery",
  "Paper": "Stationery",
  "Notebooks": "Copy & Notebook",
  "School Books & Educational Material": "School Courses & Books",
  "School Books": "School Courses & Books",
  "Books": "School Courses & Books",
  "Books & Courses": "School Courses & Books",
  "General & Daily-Use Products": "General Items",
  "General": "General Items",
  "Daily Essentials": "General Items",
  "School Bags & Accessories": "General Items",
  "Perfume": "Perfume & Fragrance",
  "Perfumes": "Perfume & Fragrance",
  "Fragrance": "Perfume & Fragrance",
  "Purse & Belt": "Belt & Fashion Accessories",
  "Bags & Belts": "Belt & Fashion Accessories",
  "Tarpaulin": "Tirpal & Tarpaulin",
  "Tirpal": "Tirpal & Tarpaulin",
  "Net": "Net Products"
};

async function preview() {
  const rows = await Product.aggregate([
    { $match: { active: true } },
    { $group: { _id: "$category", count: { $sum: 1 }, samples: { $push: "$name" } } },
    { $project: { category: "$_id", count: 1, samples: { $slice: ["$samples", 3] } } },
    { $sort: { category: 1 } }
  ]);
  return rows.map(row => ({
    category: row.category,
    count: row.count,
    suggestedCategory: mapping[row.category] || (row.category === "Tarpaulin & Net Products" ? "Split by product name" : null),
    samples: row.samples
  }));
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    return NextResponse.json({ ok: true, categories: await preview() });
  } catch (error) {
    console.error("Catalogue migration preview failed:", error);
    return NextResponse.json({ ok: false, error: "Could not preview legacy categories" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 }); }
  if (body?.confirm !== "APPLY_PINAKK_EIGHT_CATEGORY_MAPPING") {
    return NextResponse.json({ ok: false, error: "Explicit migration confirmation is required" }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const results: { from: string; to: string; modified: number }[] = [];
    for (const [from, to] of Object.entries(mapping)) {
      const result = await Product.updateMany({ category: from }, { $set: { category: to } });
      if (result.modifiedCount) results.push({ from, to, modified: result.modifiedCount });
    }
    const combined = await Product.find({ category: "Tarpaulin & Net Products" }).select("_id name description").lean();
    let net = 0, tarpaulin = 0;
    for (const product of combined) {
      const text = product.name + " " + (product.description || "");
      const isNet = /\b(net|mesh|shade|anti.?bird|anti.?insect|mosquito|fishing|poultry|fencing|cricket practice)\b/i.test(text);
      await Product.updateOne({ _id: product._id }, { $set: { category: isNet ? "Net Products" : "Tirpal & Tarpaulin" } });
      if (isNet) net++; else tarpaulin++;
    }
    const remaining = await preview();
    return NextResponse.json({ ok: true, results, split: { "Net Products": net, "Tirpal & Tarpaulin": tarpaulin }, remaining });
  } catch (error) {
    console.error("Catalogue migration failed:", error);
    return NextResponse.json({ ok: false, error: "Catalogue migration failed" }, { status: 500 });
  }
}
