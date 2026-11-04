"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, PackageCheck, RefreshCw, Truck } from "lucide-react";
import LiveCourierMap from "@/components/LiveCourierMap";

type TrackingData = { order: { orderNumber: string; status: string; fulfillmentMethod: string }; location: null | { lat: number; lng: number; accuracy?: number; updatedAt: string }; message: string };
const steps = ["pending", "confirmed", "processing", "ready", "shipped", "delivered"];
export default function TrackOrderPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/orders/" + params.id + "/tracking", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tracking unavailable");
      setData(result); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Tracking unavailable"); }
    finally { setLoading(false); }
  }, [params.id]);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  return <main className="pinakk-account"><header className="pinakk-account-header"><Link href="/customer" className="pa-brand"><b>ℙ</b><span>PINAKK<small>ORDER TRACKING</small></span></Link><Link href="/customer"><ArrowLeft size={16}/> My account</Link></header><section className="pinakk-account-body">
    <div className="pinakk-account-welcome"><div><small>DELIVERY UPDATES</small><h1>Track your order</h1><p>Live tracking refreshes automatically every 8 seconds.</p></div><button onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    {loading && <p>Loading order tracking…</p>}{error && <p className="pa-error">{error}</p>}
    {data && <><section className="pinakk-track-card"><div><small>ORDER NUMBER</small><h2>{data.order.orderNumber}</h2><span className={"pa-status " + data.order.status}>{data.order.status}</span></div><p>{data.message}</p><div className="pinakk-track-steps">{steps.map((step, i) => <div key={step} className={steps.indexOf(data.order.status) >= i ? "done" : ""}><i/><span>{step}</span></div>)}</div></section>
      {data.location ? <LiveCourierMap lat={data.location.lat} lng={data.location.lng} updatedAt={data.location.updatedAt} accuracy={data.location.accuracy}/> : <section className="pinakk-track-card"><Truck size={28}/><p>{data.message}</p></section>}
    </>}
  </section></main>;
}
