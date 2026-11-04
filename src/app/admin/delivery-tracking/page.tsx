"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Truck } from "lucide-react";
import LiveCourierMap from "@/components/LiveCourierMap";

type Delivery = { orderId: string; orderNumber: string; customer: { name: string; phone: string }; deliveryBoy: { name: string; phone: string }; address?: { line1?: string; city?: string; state?: string }; location: null | { lat: number; lng: number; accuracy?: number; updatedAt: string } };
export default function AdminDeliveryTrackingPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { const r = await fetch("/api/admin/delivery-tracking", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Tracking unavailable"); setDeliveries(d.deliveries || []); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Tracking unavailable"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const timer = window.setInterval(load, 8000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { if (!deliveries.some(d => d.orderId === selected)) setSelected(deliveries[0]?.orderId || ""); }, [deliveries, selected]);
  const active = deliveries.find(d => d.orderId === selected);
  return <main className="pinakk-account"><header className="pinakk-account-header"><Link href="/admin/delivery" className="pa-back"><ArrowLeft size={16}/> Delivery management</Link><Link href="/" className="pa-brand"><b>ℙ</b><span>PINAKK<small>LIVE DELIVERY CONTROL</small></span></Link><button onClick={load}><RefreshCw size={15}/> Refresh</button></header><section className="pinakk-account-body"><div className="pinakk-account-welcome"><div><small>OPERATIONS / LIVE GPS</small><h1>Live delivery tracking</h1><p>Active courier locations refresh automatically every 8 seconds.</p></div></div>{error&&<p className="pa-error">{error}</p>}{loading&&<p>Loading active deliveries…</p>}{!loading&&deliveries.length===0&&<section className="pinakk-track-card"><Truck size={26}/><p>No active courier location yet. Assign a delivery partner, mark the order shipped, and ask the partner to start GPS sharing.</p></section>}{deliveries.length>0&&<div className="pinakk-track-layout"><section className="pinakk-account-orders"><div><h2>Active couriers ({deliveries.length})</h2></div>{deliveries.map(d=><article key={d.orderId}><div><b>{d.orderNumber}</b><small>{d.deliveryBoy?.name} · {d.deliveryBoy?.phone}</small><small>Customer: {d.customer?.name}</small><small>{d.location ? "GPS updated "+new Date(d.location.updatedAt).toLocaleTimeString("en-IN") : "Waiting for GPS"}</small></div><button className="pa-primary-link" onClick={()=>setSelected(d.orderId)}>View map</button></article>)}</section>{active&&<section className="pinakk-track-card"><h2>{active.orderNumber}</h2><p>Courier: {active.deliveryBoy?.name} · {active.deliveryBoy?.phone}</p><p>Destination: {[active.address?.line1,active.address?.city,active.address?.state].filter(Boolean).join(", ") || "Address unavailable"}</p>{active.location?<LiveCourierMap lat={active.location.lat} lng={active.location.lng} updatedAt={active.location.updatedAt} accuracy={active.location.accuracy}/>:<p>Waiting for delivery partner to enable live GPS.</p>}</section>}</div>}</section></main>;
}
