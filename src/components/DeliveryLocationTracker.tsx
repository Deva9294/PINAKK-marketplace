"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Radio, Square } from "lucide-react";

export default function DeliveryLocationTracker({ orderId }: { orderId: string }) {
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("Location sharing is off");
  const [error, setError] = useState("");
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  function stop() {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
    setSharing(false);
    setMessage("Location sharing stopped");
  }

  function start() {
    setError("");
    if (!navigator.geolocation) { setError("This browser does not support GPS location."); return; }
    if (!window.isSecureContext) { setError("GPS requires HTTPS. Open PINAKK using its secure Render URL."); return; }
    setMessage("Waiting for GPS permission…");
    watchId.current = navigator.geolocation.watchPosition(async position => {
      const now = Date.now();
      if (now - lastSent.current < 5000) return;
      lastSent.current = now;
      try {
        const response = await fetch("/api/delivery/location", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId, lat: position.coords.latitude, lng: position.coords.longitude,
            accuracy: position.coords.accuracy, heading: position.coords.heading, speed: position.coords.speed }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Location update failed");
        setSharing(true);
        setMessage("Live location is being shared · GPS accuracy ±" + Math.round(position.coords.accuracy) + " m");
      } catch (e) { setError(e instanceof Error ? e.message : "Could not share location"); }
    }, e => {
      setSharing(false);
      setError(e.code === 1 ? "Please allow location permission to share your live position." : e.code === 2 ? "GPS location is unavailable. Check device location settings." : "GPS request timed out. Try again.");
    }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
    setSharing(true);
  }

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  return <div className="pinakk-location-share">
    <div><MapPin size={16}/><span>{message}</span></div>
    {error && <small role="alert">{error}</small>}
    {sharing ? <button type="button" onClick={stop}><Square size={14}/> Stop sharing</button> : <button type="button" onClick={start}><Radio size={14}/> Start live GPS</button>}
    <small>Share only while delivering this order. Keep this page open; background tracking may pause when the browser is closed or suspended.</small>
  </div>;
}
