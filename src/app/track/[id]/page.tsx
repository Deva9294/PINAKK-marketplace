"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, PackageCheck, RefreshCw, Truck } from "lucide-react";
import LiveCourierMap from "@/components/LiveCourierMap";

type TrackingData = {
  order: { orderNumber: string; status: string; fulfillmentMethod: string };
  location: null | { lat: number; lng: number; accuracy?: number; updatedAt: string };
  message: string;
};
const steps = ["pending", "confirmed", "processing", "ready", "shipped", "delivered"];

export default function TrackOrderPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [guestMode, setGuestMode] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = guestMode
        ? await fetch("/api/public/orders/track", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderId: params.id, phone })
          })
        : await fetch("/api/account/orders/" + params.id + "/tracking", { cache: "no-store" });
      const result = await response.json();
      if (response.status === 401 && !guestMode) {
        setNeedsPhone(true);
        setError("");
        return;
      }
      if (!response.ok) throw new Error(result.error || "Tracking unavailable");
      setData(result);
      setNeedsPhone(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tracking unavailable");
    } finally {
      setLoading(false);
    }
  }, [params.id, guestMode, phone]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function verifyGuestPhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/public/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: params.id, phone })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Order could not be found");
      setData(result);
      setGuestMode(true);
      setNeedsPhone(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order could not be found");
    } finally {
      setLoading(false);
    }
  }

  return <main className="pinakk-account">
    <header className="pinakk-account-header">
      <Link href="/customer" className="pa-brand"><b>ℙ</b><span>PINAKK<small>ORDER TRACKING</small></span></Link>
      <Link href="/customer"><ArrowLeft size={16}/> My account</Link>
    </header>
    <section className="pinakk-account-body">
      <div className="pinakk-account-welcome">
        <div><small>DELIVERY UPDATES</small><h1>Track your order</h1><p>Live tracking refreshes automatically every 8 seconds.</p></div>
        <button onClick={load}><RefreshCw size={15}/> Refresh</button>
      </div>
      {loading && <p>Loading order tracking…</p>}
      {needsPhone && !data && <section className="pinakk-account-card">
        <h2>Verify your order</h2>
        <p>Enter the mobile number used at checkout to securely view this order's status and courier location.</p>
        <form onSubmit={verifyGuestPhone}>
          <label>Registered mobile number
            <input required type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+91[- ]?)?[6-9][0-9]{9}" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit mobile number"/>
          </label>
          <button className="pa-primary-link" disabled={loading}>Verify & track order</button>
        </form>
      </section>}
      {error && <p className="pa-error">{error}</p>}
      {data && <>
        <section className="pinakk-track-card">
          <div><small>ORDER NUMBER</small><h2>{data.order.orderNumber}</h2><span className={"pa-status " + data.order.status}>{data.order.status}</span></div>
          <p>{data.message}</p>
          <div className="pinakk-track-steps">{steps.map((step, i) => <div key={step} className={steps.indexOf(data.order.status) >= i ? "done" : ""}><i/><span>{step}</span></div>)}</div>
        </section>
        {data.location ? <LiveCourierMap lat={data.location.lat} lng={data.location.lng} updatedAt={data.location.updatedAt} accuracy={data.location.accuracy}/> : <section className="pinakk-track-card"><Truck size={28}/><p>{data.message}</p></section>}
      </>}
    </section>
  </main>;
}
