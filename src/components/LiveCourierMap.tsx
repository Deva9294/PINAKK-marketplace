"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type Props = { lat: number; lng: number; updatedAt?: string; accuracy?: number };
export default function LiveCourierMap({ lat, lng, updatedAt, accuracy }: Props) {
  const host = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = await import("leaflet");
      if (disposed || !host.current) return;
      if (!mapRef.current) {
        const map = L.map(host.current, { zoomControl: true }).setView([lat, lng], 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup("PINAKK delivery partner");
        mapRef.current = map;
      } else {
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
        markerRef.current?.setLatLng([lat, lng]);
      }
    })();
    return () => { disposed = true; };
  }, [lat, lng]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; }, []);

  return <div className="pinakk-live-map-wrap">
    <div ref={host} className="pinakk-live-map" aria-label="Live courier location map"/>
    <div className="pinakk-map-caption"><span><i/> Courier's latest shared position</span><small>{updatedAt ? "Updated " + new Date(updatedAt).toLocaleTimeString("en-IN") : "Waiting for location"}{accuracy ? " · ±" + Math.round(accuracy) + " m" : ""}</small></div>
  </div>;
}
