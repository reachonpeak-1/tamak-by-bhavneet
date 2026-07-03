"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/format";
import { useStore } from "./StoreProvider";

const vb = (m: string) => (m === "mandala" ? "0 0 200 200" : "0 0 240 280");

export default function ProductDetail({ p }: { p: Product }) {
  const { addToBag, toggleWish, isWished, toast } = useStore();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const saved = isWished(p.id);

  // use product gallery directly
  const gallery = p.gallery.length ? p.gallery : [{ path: "", blurDataURL: "", url: undefined }];
  const main = gallery[Math.min(active, gallery.length - 1)];
  const stock = p.stock;

  const onAdd = () => {
    if (stock <= 0) {
      toast("Out of stock");
      return;
    }
    addToBag({ id: p.id, name: p.name, price: p.price, image: main?.url ?? p.image, qty });
    toast(`Added to bag · ${p.name}`);
  };

  return (
    <div className="pdp">
      <div className="pdp__gallery">
        <div className={`pdp__main frame ${p.panel}`}>
          {main?.url ? (
            <Image
              src={main.url}
              alt={p.name}
              fill
              priority
              sizes="(max-width:860px) 100vw, 50vw"
              placeholder={main.blurDataURL ? "blur" : "empty"}
              blurDataURL={main.blurDataURL}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className={`motif ${p.tone}`}>
              <svg viewBox={vb(p.motif)}>
                <use href={`#${p.motif}`} />
              </svg>
            </div>
          )}
        </div>
        {gallery.length > 1 && (
          <div className="pdp__thumbs">
            {gallery.map((g, i) => (
              <button
                key={i}
                className={`pdp__thumb frame ${p.panel}${i === active ? " active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
              >
                {g.url ? (
                  <Image src={g.url} alt="" fill sizes="70px" style={{ objectFit: "cover" }} />
                ) : (
                  <div className={`motif ${p.tone}`} style={{ opacity: 0.5 }}>
                    <svg viewBox={vb(p.motif)}>
                      <use href={`#${p.motif}`} />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pdp__info">
        <span className="eyebrow">{p.category}</span>
        <h1>{p.name}</h1>
        <div className="rating">
          <span className="stars" aria-hidden="true">
            {"★★★★★☆☆☆☆☆".slice(5 - Math.round(p.rating), 10 - Math.round(p.rating))}
          </span>{" "}
          <b>{p.rating.toFixed(1)}</b> <span>({p.reviews} reviews)</span>
        </div>
        <p className="fab">{p.fabric}</p>
        <div className="pdp__price">
          ₹{inr(p.price)}
          {p.oldPrice && <s>₹{inr(p.oldPrice)}</s>}
        </div>
        {p.description && <p className="pdp__desc">{p.description}</p>}


        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: ".4rem 0 1rem" }}>
          <span className="eyebrow">Qty</span>
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity">+</button>
          </div>
        </div>

        <div className="hero__cta">
          <button className="btn btn--solid" onClick={onAdd}>Add to Cart</button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              toggleWish(p.id);
              toast(saved ? "Removed from wishlist" : "Saved to wishlist");
            }}
          >
            {saved ? "Saved ♥" : "Save"}
          </button>
        </div>

        <div className="pdp__meta">
          <div>{stock > 0 ? "In stock · Ships within 2–3 business days" : "Currently unavailable"}</div>
          <div>Unstitched fabric · Dispatched as-is</div>
          <div>Free shipping across India · Easy 7-day returns</div>
          <div>For {p.gender}</div>
        </div>

        <Link className="link-back" href="/shop" style={{ marginTop: "1.4rem" }}>← Back to shop</Link>
      </div>
    </div>
  );
}
