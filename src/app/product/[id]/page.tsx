import type { Metadata } from "next";
import Link from "next/link";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import { products as demoProducts } from "@/lib/products";
import ProductAddButton from "@/components/ProductAddButton";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";

type ProductView = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  stock: number;
  sku?: string;
};

async function getProduct(id: string): Promise<ProductView | null> {
  const demo = demoProducts.find(item => item.id === id);
  if (demo) return demo;
  if (!mongoose.isValidObjectId(id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
  try {
    await connectToDatabase();
    const product = await ProductModel.findOne({
      active: true,
      ...(mongoose.isValidObjectId(id) ? { _id: id } : { slug: id })
    }).lean() as any;
    if (!product) return null;
    return {
      id: String(product._id),
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      oldPrice: product.compareAtPrice,
      image: product.image || "/pinakk-logo.svg",
      stock: product.stock,
      sku: product.sku
    };
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: "/product/" + product.id },
    openGraph: {
      type: "website",
      title: product.name + " | PINAKK",
      description,
      url: siteUrl + "/product/" + product.id,
      images: product.image ? [{ url: product.image, alt: product.name }] : []
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const productUrl = siteUrl + "/product/" + product.id;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    category: product.category,
    brand: { "@type": "Brand", name: "PINAKK" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return (
    <main className="pk-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="pk-detail-header">
        <Link href="/" className="pk-detail-brand"><span>P✦</span><b>PINAKK</b></Link>
        <div className="pk-detail-header-actions"><Link href="/cart">View shopping bag <span>↗</span></Link><Link href="/">Continue shopping</Link></div>
      </header>
      <div className="pk-detail-breadcrumb"><Link href="/">Home</Link><span>/</span><span>{product.category}</span><span>/</span><b>{product.name}</b></div>
      <section className="pk-detail-card">
        <div className="pk-detail-image"><img src={product.image} alt={product.name} /></div>
        <div className="pk-detail-copy">
          <span className="pk-detail-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="pk-detail-price"><b>₹{product.price.toLocaleString("en-IN")}</b>{product.oldPrice && product.oldPrice > product.price && <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>}{product.oldPrice && product.oldPrice > product.price && <em>{Math.round((1 - product.price / product.oldPrice) * 100)}% off</em>}</div>
          <span className={product.stock > 0 ? "pk-detail-stock" : "pk-detail-stock out"}>{product.stock > 0 ? "Available to order" : "Currently out of stock"}</span>
          <ProductAddButton productId={product.id} productName={product.name} disabled={product.stock < 1} />
          <div className="pk-detail-assurances"><span>✓ Secure checkout</span><span>✓ Local customer support</span><span>✓ Clear order updates</span></div>
        </div>
      </section>
      <footer className="pk-detail-footer">Need help with this product? <a href="https://wa.me/919685535343" target="_blank" rel="noreferrer">Chat with PINAKK support</a></footer>
    </main>
  );
}
