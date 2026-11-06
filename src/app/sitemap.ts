import type { MetadataRoute } from "next";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { catalogueCategories } from "@/lib/catalogue";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...catalogueCategories.filter(category => category.active).map(category => ({
      url: siteUrl + "/category/" + category.slug,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    }))
  ];
  try {
    await connectToDatabase();
    const products = await Product.find({ active: true }).select("_id updatedAt").lean() as { _id: mongoose.Types.ObjectId; updatedAt?: Date }[];
    entries.push(...products.map(product => ({
      url: siteUrl + "/product/" + String(product._id),
      lastModified: product.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })));
  } catch {
    // Keep the public storefront and sample product URLs available if the database is offline.
  }
  return entries;
}
