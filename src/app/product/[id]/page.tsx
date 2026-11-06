import type { Metadata } from "next";
import Link from "next/link";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import ProductAddButton from "@/components/ProductAddButton";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";

type DetailVariant = {
  id: string;
  sku?: string;
  attributes: Record<string, string>;
  price?: number;
  compareAtPrice?: number;
  stock: number;
  image?: string;
};
type ProductView = {
  id: string; slug: string; name: string; category: string; subcategory: string;
  description: string; price: number; oldPrice?: number; image: string; images: string[];
  stock: number; sku?: string; barcode?: string; brand?: string; gstRate?: number;
  hsnCode?: string; weight?: number; size?: string; colour?: string; gsm?: number;
  material?: string; specifications: Record<string,string>; variants: DetailVariant[];
  schoolCourse: Record<string,string | boolean>; tags: string[];
  customDimensions?: { enabled?: boolean; unit?: string; pricePerUnit?: number };
  seoTitle?: string; seoDescription?: string;
};

function toRecord(value: any): Record<string,string> {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries()).reduce((out, [k,v]) => ({...out,[k]:String(v)}), {} as Record<string,string>);
  if (typeof value === "object" && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).filter(([,v]) => v !== undefined && v !== null && v !== "").map(([k,v]) => [k,String(v)]));
  return {};
}

async function getProduct(id: string): Promise<ProductView | null> {
  if (!mongoose.isValidObjectId(id) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
  try {
    await connectToDatabase();
    const product = await ProductModel.findOne({
      active: true,
      ...(mongoose.isValidObjectId(id) ? { _id: id } : { slug: id })
    }).lean() as any;
    if (!product) return null;
    const images = [...new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].filter((x): x is string => typeof x === "string" && x.trim().length > 0))];
    const variants: DetailVariant[] = (Array.isArray(product.variants) ? product.variants : []).filter((v:any) => v.active !== false).map((v:any) => ({
      id: String(v._id || ""), sku: v.sku || "", attributes: toRecord(v.attributes),
      price: typeof v.price === "number" ? v.price : undefined,
      compareAtPrice: typeof v.compareAtPrice === "number" ? v.compareAtPrice : undefined,
      stock: Number(v.stock || 0), image: v.image || ""
    }));
    return {
      id: String(product._id), slug: product.slug || String(product._id), name: product.name || "",
      category: product.category || "Products", subcategory: product.subcategory || "",
      description: product.description || "", price: Number(product.price || 0),
      oldPrice: typeof product.compareAtPrice === "number" ? product.compareAtPrice : undefined,
      image: images[0] || "/pinakk-logo.svg", images: images.length ? images : ["/pinakk-logo.svg"],
      stock: Number(product.stock || 0), sku: product.sku || "", barcode: product.barcode || "",
      brand: product.brand || "", gstRate: typeof product.gstRate === "number" ? product.gstRate : undefined,
      hsnCode: product.hsnCode || "", weight: typeof product.weight === "number" ? product.weight : undefined,
      size: product.size || "", colour: product.colour || "", gsm: typeof product.gsm === "number" ? product.gsm : undefined,
      material: product.material || "", specifications: toRecord(product.specifications),
      variants, schoolCourse: product.schoolCourse || {}, tags: Array.isArray(product.tags) ? product.tags : [],
      customDimensions: product.customDimensions || undefined,
      seoTitle: product.seoTitle || "", seoDescription: product.seoDescription || ""
    };
  } catch (error) {
    console.error("Product detail lookup failed:", error);
    return null;
  }
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  const description = (product.seoDescription || product.description || (product.name + " at PINAKK")).slice(0, 320);
  const canonical = "/product/" + product.slug;
  return {
    title: product.seoTitle || product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website", title: product.seoTitle || product.name + " | PINAKK",
      description, url: siteUrl + canonical,
      images: product.images.map(url => ({ url, alt: product.name }))
    }
  };
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const productUrl = siteUrl + "/product/" + product.slug;
  const structuredData = {
    "@context": "https://schema.org", "@type": "Product",
    name: product.name, description: product.description, image: product.images,
    sku: product.sku || undefined, mpn: product.barcode || undefined,
    category: [product.category, product.subcategory].filter(Boolean).join(" / "),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer", url: productUrl, priceCurrency: "INR", price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
  const courseEntries = Object.entries(product.schoolCourse).filter(([key,value]) => value !== undefined && value !== null && value !== "" && key !== "verifiedOfficial");
  const detailEntries = [
    ["Brand", product.brand], ["SKU", product.sku], ["Barcode", product.barcode],
    ["Material", product.material], ["Size", product.size], ["Colour", product.colour],
    ["Weight", product.weight !== undefined ? product.weight + " g" : undefined],
    ["GSM", product.gsm !== undefined ? product.gsm + " GSM" : undefined],
    ["HSN code", product.hsnCode], ["GST rate", product.gstRate !== undefined ? product.gstRate + "%" : undefined]
  ].filter((entry): entry is [string,string] => typeof entry[1] === "string" && entry[1].length > 0);

  return (
    <main className="pk-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="pk-detail-header">
        <Link href="/" className="pk-detail-brand"><span>P✦</span><b>PINAKK</b></Link>
        <div className="pk-detail-header-actions"><Link href="/cart">Shopping bag ↗</Link><Link href="/">Continue shopping</Link></div>
      </header>
      <nav className="pk-detail-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href={"/category/" + product.category.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}>{product.category}</Link>
        {product.subcategory && <><span>/</span><span>{product.subcategory}</span></>}<span>/</span><b>{product.name}</b>
      </nav>

      <section className="pk-detail-layout">
        <div className="pk-detail-gallery">
          <div className="pk-detail-main-image"><img src={product.image} alt={product.name} /></div>
          {product.images.length > 1 && <div className="pk-detail-thumbnails">{product.images.map((image,index) => <div key={image + index}><img src={image} alt={product.name + " view " + (index + 1)} /></div>)}</div>}
        </div>
        <div className="pk-detail-copy">
          <div className="pk-detail-kickers"><span>{product.category}</span>{product.subcategory && <span>{product.subcategory}</span>}</div>
          {product.brand && <p className="pk-detail-brand-name">{product.brand}</p>}
          <h1>{product.name}</h1>
          <p className="pk-detail-description">{product.description || "Product description will be updated by the PINAKK store team."}</p>
          <div className="pk-detail-price">
            <b>₹{product.price.toLocaleString("en-IN")}</b>
            {product.oldPrice && product.oldPrice > product.price && <del>₹{product.oldPrice.toLocaleString("en-IN")}</del>}
            {product.oldPrice && product.oldPrice > product.price && <em>{Math.round((1 - product.price / product.oldPrice) * 100)}% off</em>}
          </div>
          <p className="pk-detail-tax-note">{product.gstRate !== undefined ? "GST " + product.gstRate + "% · " : ""}Final tax and invoice details are shown at checkout.</p>
          <span className={product.stock > 0 ? "pk-detail-stock" : "pk-detail-stock out"}>{product.stock > 0 ? "In stock · " + product.stock + " available" : "Currently out of stock"}</span>
          <ProductAddButton productId={product.id} productName={product.name} disabled={product.stock < 1} />
          <div className="pk-detail-benefits"><span>✓ COD / Pay at Store</span><span>✓ Order status updates</span><span>✓ Local customer support</span></div>
          {product.sku && <p className="pk-detail-sku">Product code: {product.sku}</p>}
        </div>
      </section>

      {product.variants.length > 0 && <section className="pk-detail-section">
        <div className="pk-detail-section-heading"><span>CHOOSE YOUR OPTION</span><h2>Available variants</h2></div>
        <div className="pk-detail-variants">{product.variants.map((variant,index) => <article key={variant.id || index}>
          <b>{Object.values(variant.attributes).join(" · ") || "Option " + (index + 1)}</b>
          {variant.sku && <small>SKU: {variant.sku}</small>}
          <strong>{variant.price !== undefined ? "₹" + variant.price.toLocaleString("en-IN") : "₹" + product.price.toLocaleString("en-IN")}</strong>
          <span className={variant.stock > 0 ? "available" : "unavailable"}>{variant.stock > 0 ? variant.stock + " available" : "Out of stock"}</span>
        </article>)}</div>
        <p className="pk-detail-note">Variant selection and variant-specific stock reservation are not enabled in this cart yet. Please confirm your preferred option with support before ordering.</p>
      </section>}

      <section className="pk-detail-information">
        <article className="pk-detail-section">
          <div className="pk-detail-section-heading"><span>PRODUCT INFORMATION</span><h2>About this item</h2></div>
          <p>{product.description || "Detailed product information will be added by the store team."}</p>
          {product.tags.length > 0 && <div className="pk-detail-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        </article>
        <article className="pk-detail-section">
          <div className="pk-detail-section-heading"><span>GOOD TO KNOW</span><h2>Product specifications</h2></div>
          {Object.keys(product.specifications).length > 0 || detailEntries.length > 0 ? <dl className="pk-detail-specs">
            {detailEntries.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            {Object.entries(product.specifications).map(([label,value]) => <div key={label}><dt>{formatLabel(label)}</dt><dd>{value}</dd></div>)}
          </dl> : <p className="pk-detail-note">No technical specifications have been supplied for this item yet. The store team can add verified details in product management.</p>}
        </article>
      </section>

      {courseEntries.length > 0 && <section className="pk-detail-section">
        <div className="pk-detail-section-heading"><span>SCHOOL & COURSE DETAILS</span><h2>Course information</h2></div>
        <dl className="pk-detail-specs">{courseEntries.map(([key,value]) => <div key={key}><dt>{formatLabel(key)}</dt><dd>{String(value)}</dd></div>)}</dl>
        {product.schoolCourse.verifiedOfficial === true && <p className="pk-detail-verified">✓ Official details verified by the store team</p>}
      </section>}

      {product.customDimensions?.enabled && <section className="pk-detail-section">
        <div className="pk-detail-section-heading"><span>CUSTOM ORDER</span><h2>Custom dimensions available</h2></div>
        <p>This item supports custom measurements. Contact the store team to confirm the required dimensions, quantity and final quote before placing your order.</p>
        {product.customDimensions.pricePerUnit !== undefined && <p className="pk-detail-custom-price">Indicative rate: ₹{product.customDimensions.pricePerUnit.toLocaleString("en-IN")} / {product.customDimensions.unit || "unit"}</p>}
      </section>}

      <section className="pk-detail-help"><div><span>NEED HELP BEFORE ORDERING?</span><h2>Ask us about this item.</h2><p>Confirm sizes, variants, availability or delivery details with the PINAKK team.</p></div><a href={"https://wa.me/919685535343?text=" + encodeURIComponent("Hello PINAKK, I need details about " + product.name + " (₹" + product.price + ").")} target="_blank" rel="noreferrer">Chat on WhatsApp ↗</a></section>
      <footer className="pk-detail-footer">© {new Date().getFullYear()} PINAKK · Shop Smart, Live Better · <Link href="/">Back to store</Link></footer>
    </main>
  );
}
