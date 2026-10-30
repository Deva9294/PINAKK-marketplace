"use client";
import "./cart.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { products as demoProducts, type Product } from "@/lib/products";

export default function CartPage() {
  const [catalogue, setCatalogue] = useState<Product[]>(demoProducts);
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("pinakk-cart") || "[]")); } catch { setCart([]); }
    fetch("/api/products").then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data.products) && data.products.length) {
          setCatalogue(data.products.map((p: any) => ({
            id: String(p._id), name: p.name, category: p.category, price: p.price,
            oldPrice: p.compareAtPrice, description: p.description, image: p.image || "", stock: p.stock
          })));
        }
      }).catch(() => {});
  }, []);
  useEffect(() => { localStorage.setItem("pinakk-cart", JSON.stringify(cart)); }, [cart]);
  const items = useMemo(() => cart.map(c => ({ ...c, product: catalogue.find(p => p.id === c.id) })).filter(x => x.product), [cart, catalogue]);
  const total = items.reduce((sum, x) => sum + (x.product?.price || 0) * x.qty, 0);
  function update(id: string, delta: number) {
    setCart(old => old.map(x => x.id === id ? { ...x, qty: Math.max(0, Math.min(20, x.qty + delta)) } : x).filter(x => x.qty > 0));
  }
  return <main className="cart-page">
    <Link href="/" className="brand"><span className="brand-mark">P</span><span><b>PINAKK</b><small>EVERYDAY, MADE EASIER</small></span></Link>
    <div className="cart-wrap">
      <Link href="/" className="back"><ArrowLeft size={16}/> Continue shopping</Link>
      <h1 className="cart-title">Your shopping bag</h1>
      {items.length === 0 ? <div className="cart-empty"><ShoppingBag size={38}/><h2>Your bag is waiting</h2><p>Find something useful for your everyday.</p><Link className="primary-btn" href="/">Explore products</Link></div> :
      <div className="cart-layout">
        <div className="cart-items">{items.map(x => <div className="cart-row" key={x.id}>
          <div className="cart-thumb" style={{ backgroundImage: "url(" + x.product?.image + ")" }}/>
          <div className="cart-desc"><small>{x.product?.category}</small><b>{x.product?.name}</b><span>₹{x.product?.price}</span></div>
          <div className="qty"><button aria-label="Decrease quantity" onClick={() => update(x.id, -1)}><Minus size={14}/></button><b>{x.qty}</b><button aria-label="Increase quantity" onClick={() => update(x.id, 1)}><Plus size={14}/></button></div>
          <button className="remove" aria-label="Remove item" onClick={() => setCart(old => old.filter(i => i.id !== x.id))}><Trash2 size={16}/></button>
        </div>)}</div>
        <aside className="summary"><h3>Order summary</h3><div><span>Subtotal</span><b>₹{total.toLocaleString("en-IN")}</b></div><div><span>Delivery</span><b>To be confirmed</b></div><hr/><div className="grand"><span>Estimated total</span><b>₹{total.toLocaleString("en-IN")}</b></div><p>Choose store pickup or home delivery at checkout.</p><Link className="primary-btn checkout" href="/checkout">Continue to checkout</Link><small className="secure-note">Pay at store or cash on delivery. Online payment is not enabled yet.</small></aside>
      </div>}
    </div>
  </main>;
}
