import type { MetadataRoute } from "next";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { catalogueCategories } from "@/lib/catalogue";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 }
  ];
  let categoryEntries = catalogueCategories.filter(category => category.active).map(category => ({
    url: siteUrl + "/category/" + category.slug,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85
  }));
  try {
    await connectToDatabase();
    const storedCategories = await Category.find({ active: true }).select("slug updatedAt").lean();
    if (storedCategories.length) {
      categoryEntries = storedCategories.map(category => ({
        url: siteUrl + "/category/" + category.slug,
        lastModified: category.updatedAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.85
      }));
    }
    const products = await Product.find({ active: true }).select("_id updatedAt").lean() as { _id: mongoose.Types.ObjectId; updatedAt?: Date }[];
    entries.push(...products.map(product => ({
      url: siteUrl + "/product/" + String(product._id),
      lastModified: product.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })));
  } catch {
    // Keep default category URLs in the sitemap while MongoDB is unavailable.
  }
  entries.push(...categoryEntries);
  return entries;
}
