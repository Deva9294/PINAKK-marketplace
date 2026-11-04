"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";

type Props = { productId: string; productName: string; disabled?: boolean };

export default function ProductAddButton({ productId, productName, disabled = false }: Props) {
  const [added, setAdded] = useState(false);
  function addToBag() {
    try {
      const current = JSON.parse(localStorage.getItem("pinakk-cart") || "[]") as { id: string; qty: number }[];
      const found = current.find(item => item.id === productId);
      const next = found
        ? current.map(item => item.id === productId ? { ...item, qty: item.qty + 1 } : item)
        : [...current, { id: productId, qty: 1 }];
      localStorage.setItem("pinakk-cart", JSON.stringify(next));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } catch {
      setAdded(false);
    }
  }
  return (
    <button className="pk-detail-add" onClick={addToBag} disabled={disabled}>
      {added ? <Check size={18} /> : <ShoppingBag size={18} />}
      {disabled ? "Out of stock" : added ? "Added to your bag" : "Add to bag"}
    </button>
  );
}
