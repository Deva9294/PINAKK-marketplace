import { NextResponse } from "next/server";

export const dynamic = "force-static";

const categories = [
  { name: "Stationery & School Supplies", slug: "stationery-school-supplies", subcategories: [
    "Notebooks", "Registers", "Long Books", "Practical Copies", "Drawing Books", "Graph Books", "Exam Pads",
    "Pens", "Pencils", "Erasers", "Sharpeners", "Scales", "Geometry Boxes", "Colors", "Crayons", "Sketch Pens",
    "Art & Craft Supplies", "Files and Folders", "Staplers", "Paper Clips"
  ]},
  { name: "Paper & Printing Supplies", slug: "paper-printing-supplies", subcategories: [
    "Glossy Paper", "Photo Paper", "A4 Copy Paper", "Legal Size Paper", "A3 Paper", "Color Paper", "Sticker Paper",
    "Chart Paper", "Butter Paper", "Laminating Sheets", "Printing Paper Bundles", "Paper Reams", "Thermal Paper Rolls"
  ], filters: ["GSM", "Size", "Sheet Quantity", "Brand", "Pack Size"] },
  { name: "School Books & Educational Material", slug: "school-books-educational-material", subcategories: [
    "Private School Courses", "Complete School Book Sets", "NCERT Books", "State Board Books", "Hindi Medium Books",
    "English Medium Books", "Exam Guides", "Pariksha Bodh", "Question Banks", "Sample Papers", "Practice Sets",
    "Reference Books", "Competitive Exam Books", "Educational Charts"
  ], filters: ["School", "Class", "Board", "Medium", "Academic Session"] },
  { name: "School Bags & Accessories", slug: "school-bags-accessories", subcategories: [
    "School Bags", "Kids Bags", "College Bags", "Backpacks", "Lunch Boxes", "Water Bottles", "Pencil Boxes",
    "School Belts", "School Accessories", "Rain Covers"
  ]},
  { name: "General & Daily-Use Products", slug: "general-daily-use", subcategories: [
    "Household Items", "Plastic Products", "Storage Items", "Kitchen Accessories", "Cleaning Products", "Utility Products", "Small General Store Items"
  ]},
  { name: "Tarpaulin & Net Products", slug: "tarpaulin-net-products", subcategories: [
    "Waterproof Tarpaulin", "HDPE Tarpaulin", "Green Net", "Shade Net", "Agriculture Net", "Safety Net",
    "Garden Net", "Waterproof Covers", "Rope and Related Accessories"
  ], filters: ["Length", "Width", "Size", "GSM", "Thickness", "Color", "Material", "Brand"] }
];

export async function GET() {
  return NextResponse.json({ ok: true, categories }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
  });
}
