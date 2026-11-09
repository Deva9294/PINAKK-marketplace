import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { catalogueCategories } from "@/lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "All Products | PINAKK",
  description: "Browse stationery, school books, office supplies, accessories and everyday essentials at PINAKK.",
  alternates: { canonical: "/products" }
};

type Props = { searchParams: Promise<{ q?: string; category?: string; page?: string; sort?: string }> };

export default async function AllProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q || "").trim().slice(0, 100);
  const category = (params.category || "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const sortKey = params.sort || "newest";
  const sort: Record<string, 1 | -1> = sortKey === "price-low" ? { price: 1 } : sortKey === "price-high" ? { price: -1 } : { createdAt: -1 };
  const filter: Record<string, any> = { active: true };
  if (category && category !== "All") filter.category = category;
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { brand: { $regex: escaped, $options: "i" } },
      { category: { $regex: escaped, $options: "i" } },
      { subcategory: { $regex: escaped, $options: "i" } },
      { tags: { $regex: escaped, $options: "i" } },
      { sku: { $regex: escaped, $options: "i" } }
    ];
  }

  let products: any[] = [];
  let total = 0;
  let unavailable = false;
  let categoryRecords: any[] = catalogueCategories;
  try {
    await connectToDatabase();
    const storedCategories = await Category.find({ active: true }).sort({ displayOrder: 1, name: 1 }).lean();
    const bySlug = new Map<string, any>(catalogueCategories.map(c => [c.slug, c]));
    for (const c of storedCategories) bySlug.set(c.slug, { ...bySlug.get(c.slug), ...c });
    categoryRecords = [...bySlug.values()].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name));
    [products, total] = await Promise.all([
      Product.find(filter).select("_id name slug category subcategory price compareAtPrice image stock").sort(sort).skip((page - 1) * 24).limit(24).lean(),
      Product.countDocuments(filter)
    ]);
  } catch (error) {
    console.error("All products page could not load catalogue", error);
    unavailable = true;
  }
  const pages = Math.max(1, Math.ceil(total / 24));
  const href = (nextPage: number) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (category) p.set("category", category);
    if (sortKey !== "newest") p.set("sort", sortKey);
    p.set("page", String(nextPage));
    return "/products?" + p.toString();
  };

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", padding: "24px 18px 64px", color: "#111827", minHeight: "70vh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 26 }}>
        <Link href="/" style={{ color: "#1e40af", fontWeight: 800, textDecoration: "none", letterSpacing: 1 }}>P✦ PINAKK</Link>
        <nav style={{ display: "flex", gap: 16, fontSize: 14 }}><Link href="/">Home</Link><Link href="/cart">Shopping bag</Link><Link href="/customer">Account</Link></nav>
      </header>
      <div style={{ marginBottom: 22 }}>
        <p style={{ color: "#1e40af", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>SHOP THE COLLECTION</p>
        <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "6px 0 8px" }}>All products</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Browse the PINAKK catalogue and open any item to see its complete details.</p>
      </div>
      <form action="/products" style={{ display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(160px,240px) minmax(130px,180px) auto", gap: 10, marginBottom: 22 }}>
        <input name="q" defaultValue={query} placeholder="Search products, brand or SKU" style={{ minWidth: 0, padding: "12px 14px", border: "1px solid #dbe2ea", borderRadius: 10 }} />
        <select name="category" defaultValue={category} style={{ padding: "12px", border: "1px solid #dbe2ea", borderRadius: 10, background: "white" }}>
          <option value="">All categories</option>
          {categoryRecords.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
        <select name="sort" defaultValue={sortKey} style={{ padding: "12px", border: "1px solid #dbe2ea", borderRadius: 10, background: "white" }}>
          <option value="newest">Recently added</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
        </select>
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: "12px 20px", background: "#1e40af", color: "white", fontWeight: 700 }}>Apply</button>
      </form>
      <section aria-label="Browse all product categories" style={{ margin: "4px 0 28px" }}>
        <h2 style={{ fontSize: 21, margin: "0 0 14px" }}>Browse all categories</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {categoryRecords.map(c => <Link key={c.slug} href={"/products?category=" + encodeURIComponent(c.name)} style={{ display: "flex", gap: 12, alignItems: "center", padding: 13, border: "1px solid #e5e7eb", borderRadius: 13, background: category === c.name ? "#eff6ff" : "white", color: "#111827", textDecoration: "none" }}>
            <span style={{ position: "relative", width: 54, height: 54, flex: "0 0 54px", borderRadius: 10, overflow: "hidden", background: "#f8fafc" }}><Image src={c.image || "/pinakk-logo.svg"} alt="" fill sizes="54px" style={{ objectFit: "contain", padding: 5 }} /></span>
            <span><b style={{ display: "block", fontSize: 14 }}>{c.name}</b><small style={{ color: "#64748b", lineHeight: 1.4 }}>{c.description}</small></span>
          </Link>)}
        </div>
      </section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, color: "#64748b", fontSize: 13 }}>
        <span>{total} products found</span>
        {(query || category) && <Link href="/products" style={{ color: "#1e40af" }}>Clear filters</Link>}
      </div>
      {unavailable ? (
        <div style={{ padding: 28, borderRadius: 16, background: "#fff7ed", color: "#9a3412" }}>The product catalogue is temporarily unavailable. Please try again in a moment.</div>
      ) : products.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16 }}>
          {products.map(p => <article key={String(p._id)} style={{ border: "1px solid #e5e7eb", borderRadius: 15, overflow: "hidden", background: "white", display: "flex", flexDirection: "column" }}>
            <Link href={"/product/" + String(p._id)} style={{ display: "block", position: "relative", height: 180, background: "#f8fafc", padding: 12 }}>
              <Image src={p.image || "/pinakk-logo.svg"} alt={p.name} fill sizes="(max-width: 600px) 45vw, 220px" style={{ objectFit: "contain", padding: 12 }} />
            </Link>
            <div style={{ padding: 13, display: "flex", flexDirection: "column", flex: 1 }}>
              <small style={{ color: "#64748b" }}>{p.subcategory || p.category}</small>
              <Link href={"/product/" + String(p._id)} style={{ color: "#111827", fontWeight: 700, textDecoration: "none", margin: "6px 0", lineHeight: 1.4 }}>{p.name}</Link>
              <b style={{ fontSize: 18, marginTop: "auto" }}>₹{Number(p.price).toLocaleString("en-IN")}</b>
              <small style={{ color: p.stock > 0 ? "#15803d" : "#b91c1c", marginTop: 5 }}>{p.stock > 0 ? "In stock" : "Out of stock"}</small>
              <Link href={"/product/" + String(p._id)} style={{ display: "block", textAlign: "center", marginTop: 12, border: "1px solid #1e40af", borderRadius: 9, padding: "9px", color: "#1e40af", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>View full details ↗</Link>
            </div>
          </article>)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "56px 20px", border: "1px dashed #cbd5e1", borderRadius: 18, background: "#f8fafc" }}>
          <h2 style={{ fontSize: 22, margin: "0 0 8px" }}>{total === 0 && !query && !category ? "Products are not published yet" : "No products match your search"}</h2>
          <p style={{ color: "#64748b", maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.6 }}>{total === 0 && !query && !category ? "The store catalogue currently has no active product records. The store team needs to add and publish products in the admin dashboard. We have not inserted sample or made-up products." : "Try a different product name or category, or clear your filters to browse the full catalogue."}</p>
          <Link href="/products" style={{ display: "inline-block", background: "#1e40af", color: "white", padding: "11px 18px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Show all products</Link>
        </div>
      )}
      {pages > 1 && <nav aria-label="Product pages" style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28, alignItems: "center" }}>
        {page > 1 && <Link href={href(page - 1)} style={{ padding: "9px 14px", border: "1px solid #cbd5e1", borderRadius: 9 }}>Previous</Link>}
        <span style={{ color: "#64748b", fontSize: 13 }}>Page {page} of {pages}</span>
        {page < pages && <Link href={href(page + 1)} style={{ padding: "9px 14px", border: "1px solid #cbd5e1", borderRadius: 9 }}>Next</Link>}
      </nav>}
    </main>
  );
}
