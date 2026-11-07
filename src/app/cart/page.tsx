"use client";
import "./cart.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { products as demoProducts, type Product } from "@/lib/products";

type CartItem = { id: string; qty: number };

export default function CartPage() {
  const [catalogue, setCatalogue] = useState<Product[]>(demoProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [catalogueReady, setCatalogueReady] = useState(false);

  useEffect(() => {
    let saved: CartItem[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem("pinakk-cart") || "[]");
      saved = Array.isArray(parsed) ? parsed.filter((item: any) =>
        item && typeof item.id === "string" && Number.isInteger(item.qty) && item.qty > 0
      ) : [];
      setCart(saved);
    } catch {
      setCart([]);
      localStorage.removeItem("pinakk-cart");
    }
    setHydrated(true);

    if (saved.length) {
      const ids = [...new Set(saved.map(item => item.id))].slice(0, 20);
      fetch("/api/products?ids=" + encodeURIComponent(ids.join(",")), { cache: "no-store" })
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(data => {
          if (Array.isArray(data.products)) {
            setCatalogue(data.products.map((product: any) => ({
              id: String(product._id),
              name: product.name,
              category: product.category,
              price: product.price,
              oldPrice: product.compareAtPrice,
              description: product.description,
              image: product.image || "",
              stock: product.stock
            })));
          }
        })
        .catch(() => {})
        .finally(() => setCatalogueReady(true));
    } else {
      setCatalogue([]);
      setCatalogueReady(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("pinakk-cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  const items = useMemo(
    () => cart.map(item => ({ ...item, product: catalogue.find(product => product.id === item.id) })),
    [cart, catalogue]
  );
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.qty, 0);
  const hasStockIssues = items.some(item => !item.product || (item.product.stock ?? 0) < item.qty);

  function update(id: string, delta: number) {
    const product = catalogue.find(item => item.id === id);
    const max = Math.min(20, Math.max(0, product?.stock ?? 20));
    setCart(old => old.map(item => item.id === id
      ? { ...item, qty: Math.max(0, Math.min(max, item.qty + delta)) }
      : item
    ).filter(item => item.qty > 0));
  }

  if (!hydrated) {
    return <main className="cart-page"><div className="cart-wrap"><p>Loading your shopping bag…</p></div></main>;
  }

  return <main className="cart-page">
    <Link href="/" className="brand"><span className="brand-mark">P</span><span><b>PINAKK</b><small>EVERYDAY, MADE EASIER</small></span></Link>
    <div className="cart-wrap">
      <Link href="/" className="back"><ArrowLeft size={16}/> Continue shopping</Link>
      <h1 className="cart-title">Your shopping bag</h1>
      {items.length === 0 ? <div className="cart-empty"><ShoppingBag size={38}/><h2>Your bag is waiting</h2><p>Find something useful for your everyday.</p><Link className="primary-btn" href="/">Explore products</Link></div> :
      <div className="cart-layout">
        <div className="cart-items">{items.map(item => <div className="cart-row" key={item.id}>
          <div className="cart-thumb" style={{ backgroundImage: "url(" + item.product?.image + ")" }}/>
          <div className="cart-desc"><small>{item.product?.category}</small><b>{item.product?.name || "Product no longer available"}</b><span>{item.product ? "₹" + item.product.price.toLocaleString("en-IN") : "Unavailable"}</span>{(!item.product || (item.product.stock ?? 0) < 1) && <small className="pa-error">{item.product ? "Currently out of stock" : "Remove this item to continue"}</small>}</div>
          <div className="qty"><button aria-label="Decrease quantity" onClick={() => update(item.id, -1)}><Minus size={14}/></button><b>{item.qty}</b><button aria-label="Increase quantity" disabled={item.qty >= Math.min(20, item.product?.stock ?? 20)} onClick={() => update(item.id, 1)}><Plus size={14}/></button></div>
          <button className="remove" aria-label="Remove item" onClick={() => setCart(old => old.filter(current => current.id !== item.id))}><Trash2 size={16}/></button>
        </div>)}</div>
        <aside className="summary"><h3>Order summary</h3><div><span>Subtotal</span><b>₹{total.toLocaleString("en-IN")}</b></div><div><span>Delivery</span><b>Calculated at checkout</b></div><hr/><div className="grand"><span>Estimated total</span><b>₹{total.toLocaleString("en-IN")}</b></div><p>Choose store pickup or home delivery. Pay at the store or in cash when your delivery arrives.</p>{hasStockIssues ? <p className="pa-error">Please remove unavailable items or reduce quantities to the available stock before checkout.</p> : <Link className="primary-btn checkout" href="/checkout">Continue to checkout</Link>}<small className="secure-note">Online payments are currently disabled. Payment is collected at store pickup or in cash on delivery.</small></aside>
      </div>}
      {!catalogueReady && items.length > 0 && <small>Refreshing product availability…</small>}
    </div>
  </main>;
}
