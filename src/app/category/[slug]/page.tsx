import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogueCategories } from "@/lib/catalogue";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import CourseFinder from "@/components/CourseFinder";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function getCategory(slug: string) {
  try {
    await connectToDatabase();
    const stored = await Category.findOne({ slug, active: true }).lean();
    if (stored) return stored;
  } catch {
    // Use the checked-in catalogue defaults if the database is temporarily unavailable.
  }
  return catalogueCategories.find(item => item.slug === slug && item.active) || null;
}


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: true } };
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: { canonical: "/category/" + category.slug },
    openGraph: { type: "website", title: category.seoTitle, description: category.seoDescription, url: siteUrl + "/category/" + category.slug, images: [{ url: category.image, alt: category.name }] }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category || !category.active) notFound();

  let products: any[] = [];
  try {
    await connectToDatabase();
    const slugPrefix = "^" + category.slug + "-";
    products = await Product.find({
      active: true,
      $or: [
        { category: category.name },
        { slug: { $regex: slugPrefix } }
      ]
    })
      .select("_id name slug price compareAtPrice image stock subcategory")
      .sort({ createdAt: -1 }).limit(100).lean();
  } catch {
    products = [];
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.seoDescription,
    url: siteUrl + "/category/" + category.slug,
    mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: siteUrl + "/product/" + String(p._id), name: p.name })) }
  };

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 18px 60px", color: "#111827" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" style={{ fontSize: 13, marginBottom: 18, color: "#64748b" }}>
        <Link href="/">Home</Link> / <span>{category.name}</span>
      </nav>
      <header style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 24, alignItems: "center", background: "#f8fafc", borderRadius: 20, padding: 22 }}>
        <div><p style={{ color: "#1e40af", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>PINAKK COLLECTION</p><h1 style={{ fontSize: 32, lineHeight: 1.15, margin: "8px 0 12px" }}>{category.name}</h1><p style={{ color: "#475569", lineHeight: 1.7 }}>{category.description}</p></div>
        <Image src={category.image} alt={category.name + " category illustration"} unoptimized width={360} height={236} style={{ width: "100%", height: "auto", borderRadius: 14 }} priority />
      </header>
      {category.slug === "school-courses-books" && <CourseFinder />}
      <section style={{ marginTop: 30 }}><h2 style={{ fontSize: 22, marginBottom: 14 }}>Browse subcategories</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 }}>
        {category.subcategories.map(item => <div key={item} style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid #e5e7eb", borderRadius: 12, padding: 9, background: "#fff" }}><Image src={category.image} alt="" unoptimized width={42} height={42} style={{ borderRadius: 8, objectFit: "cover" }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{item}</span></div>)}
      </div></section>
      {!!category.items?.length && <section style={{ marginTop: 28 }}><h2 style={{ fontSize: 22, marginBottom: 12 }}>Complete item list</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{category.items.map(item => <span key={item} style={{ border: "1px solid #e2e8f0", borderRadius: 20, background: "#fff", padding: "7px 11px", fontSize: 12, color: "#475569" }}>{item}</span>)}</div></section>}
      <section style={{ marginTop: 32 }}><h2 style={{ fontSize: 22, marginBottom: 14 }}>Available products <span style={{ fontSize: 13, color: "#64748b" }}>({products.length})</span></h2>
        {products.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14 }}>
          {products.map(p => <Link key={String(p._id)} href={"/product/" + String(p._id)} style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "#fff", color: "inherit", textDecoration: "none" }}>
            <div style={{ background: "#f8fafc", padding: 12 }}><Image src={p.image || "/pinakk-logo.svg"} alt={p.name} unoptimized width={240} height={180} style={{ width: "100%", height: 150, objectFit: "contain" }} /></div>
            <div style={{ padding: 12 }}><small style={{ color: "#64748b" }}>{p.subcategory || category.name}</small><b style={{ display: "block", margin: "6px 0", fontSize: 13 }}>{p.name}</b><strong>₹{Number(p.price).toLocaleString("en-IN")}</strong><small style={{ display: "block", color: p.stock > 0 ? "#15803d" : "#b91c1c", marginTop: 5 }}>{p.stock > 0 ? "In stock" : "Out of stock"}</small></div>
          </Link>)}
        </div> : <p style={{ color: "#64748b", background: "#f8fafc", padding: 18, borderRadius: 12 }}>No products are listed in this category yet. Please check back soon.</p>}
      </section>
    </main>
  );
}
