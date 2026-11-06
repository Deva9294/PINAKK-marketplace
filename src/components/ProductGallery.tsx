"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0] || "/pinakk-logo.svg";
  return (
    <div className="pk-detail-gallery">
      <div className="pk-detail-main-image"><img src={current} alt={name + " product image " + (active + 1)} /></div>
      {images.length > 1 && <div className="pk-detail-thumbnails" aria-label="Product image gallery">
        {images.map((image,index) => <button type="button" key={image + index} onClick={() => setActive(index)} className={active === index ? "active" : ""} aria-label={"Show product image " + (index + 1)} aria-pressed={active === index}>
          <img src={image} alt={name + " view " + (index + 1)} />
        </button>)}
      </div>}
    </div>
  );
}
