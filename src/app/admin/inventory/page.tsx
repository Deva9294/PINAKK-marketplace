"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Boxes, RefreshCw } from "lucide-react";

type Product = { _id: string; name: string; sku?: string; category: string; stock: number };
type Movement = { _id: string; productName: string; type: string; quantity: number; beforeStock: number; afterStock: number; reference?: string; note?: string; createdAt: string };
type InventoryData = { threshold: number; lowStock: Product[]; outOfStock: Product[]; movements: Movement[] };
const moneyDate = (v: string) => new Date(v).toLocaleString("en-IN");
export default function InventoryPage() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/inventory", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Inventory could not load");
      setData(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Inventory could not load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <main style={{minHeight:"100vh",background:"#f8fafc",padding:"24px",color:"#111827",fontFamily:"Arial,sans-serif"}}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <Link href="/admin" style={{color:"#1e40af",textDecoration:"none"}}><ArrowLeft size={16} style={{verticalAlign:"middle"}}/> Back to Admin</Link>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",margin:"22px 0"}}>
        <div><p style={{color:"#f97316",fontWeight:700,letterSpacing:2,fontSize:12}}>PINAKK STORE CONTROL</p><h1 style={{fontSize:30,margin:"4px 0"}}>Inventory & Stock Alerts</h1><p style={{color:"#64748b",margin:0}}>Low stock threshold: {data?.threshold ?? 5} units</p></div>
        <button onClick={load} disabled={loading} style={{border:0,borderRadius:10,padding:"11px 16px",background:"#1e40af",color:"white",display:"flex",gap:8,alignItems:"center"}}><RefreshCw size={16}/> Refresh</button>
      </header>
      {error && <p role="alert" style={{background:"#fee2e2",padding:12,borderRadius:8,color:"#991b1b"}}>{error}</p>}
      {loading && <p>Loading inventory…</p>}
      {data && <>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:22}}>
          <article style={{background:"white",padding:18,borderRadius:14,border:"1px solid #e2e8f0"}}><Boxes color="#1e40af"/><p style={{color:"#64748b",marginBottom:4}}>Low stock</p><b style={{fontSize:28}}>{data.lowStock.length}</b></article>
          <article style={{background:"white",padding:18,borderRadius:14,border:"1px solid #fecaca"}}><AlertTriangle color="#dc2626"/><p style={{color:"#64748b",marginBottom:4}}>Out of stock</p><b style={{fontSize:28}}>{data.outOfStock.length}</b></article>
        </section>
        <section style={{background:"white",padding:18,borderRadius:14,border:"1px solid #e2e8f0",marginBottom:20,overflowX:"auto"}}>
          <h2>Low-stock products</h2>{data.lowStock.length===0?<p style={{color:"#64748b"}}>No low-stock products. Great!</p>:<table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}><thead><tr><th style={{padding:10}}>Product</th><th>SKU</th><th>Category</th><th>Available</th></tr></thead><tbody>{data.lowStock.map(p=><tr key={p._id} style={{borderTop:"1px solid #e2e8f0"}}><td style={{padding:10,fontWeight:600}}>{p.name}</td><td>{p.sku||"—"}</td><td>{p.category}</td><td style={{color:"#b45309",fontWeight:700}}>{p.stock}</td></tr>)}</tbody></table>}
        </section>
        <section style={{background:"white",padding:18,borderRadius:14,border:"1px solid #e2e8f0",marginBottom:20,overflowX:"auto"}}>
          <h2>Out-of-stock products</h2>{data.outOfStock.length===0?<p style={{color:"#64748b"}}>No out-of-stock products.</p>:<table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}><thead><tr><th style={{padding:10}}>Product</th><th>SKU</th><th>Category</th></tr></thead><tbody>{data.outOfStock.map(p=><tr key={p._id} style={{borderTop:"1px solid #e2e8f0"}}><td style={{padding:10,fontWeight:600}}>{p.name}</td><td>{p.sku||"—"}</td><td>{p.category}</td></tr>)}</tbody></table>}</section>
        <section style={{background:"white",padding:18,borderRadius:14,border:"1px solid #e2e8f0",overflowX:"auto"}}>
          <h2>Stock movement history</h2>{data.movements.length===0?<p style={{color:"#64748b"}}>New restocks, adjustments and sales will be recorded here.</p>:<table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}><thead><tr><th style={{padding:10}}>Date</th><th>Product</th><th>Type</th><th>Change</th><th>Before</th><th>After</th><th>Reference</th></tr></thead><tbody>{data.movements.map(m=><tr key={m._id} style={{borderTop:"1px solid #e2e8f0"}}><td style={{padding:10,whiteSpace:"nowrap"}}>{moneyDate(m.createdAt)}</td><td>{m.productName}</td><td>{m.type}</td><td style={{fontWeight:700}}>{m.quantity>0?"+":""}{m.quantity}</td><td>{m.beforeStock}</td><td>{m.afterStock}</td><td>{m.reference||"—"}</td></tr>)}</tbody></table>}</section>
      </>}
    </div>
  </main>;
}
