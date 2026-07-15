"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/format";
import { useStore } from "./StoreProvider";

const stars = (r: number) => {
  const f = Math.round(r);
  return "★★★★★☆☆☆☆☆".slice(5 - f, 10 - f);
};
const vb = (m: string) => (m === "mandala" ? "0 0 200 200" : "0 0 240 280");

export default function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { addToBag, toggleWish, isWished, toast } = useStore();
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const saved = isWished(p.id);

  // Find secondary image for hover reveal
  const secondaryImage =
    p.gallery?.[1]?.mediumUrl || p.gallery?.[1]?.url ||
    p.variants?.[0]?.gallery?.[1]?.mediumUrl || p.variants?.[0]?.gallery?.[1]?.url ||
    p.variants?.[1]?.gallery?.[0]?.mediumUrl || p.variants?.[1]?.gallery?.[0]?.url ||
    p.gallery?.[0]?.mediumUrl || p.gallery?.[0]?.url;

  // Calculate discount percentage if old price exists
  const discountPercent =
    p.oldPrice && p.oldPrice > p.price
      ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
      : null;

  const onAdd = () => {
    const v = p.variants?.[0];
    addToBag({
      id: p.id,
      name: p.name,
      price: p.price,
      image: v?.gallery?.[0]?.url ?? p.image,
      color: v?.name,
    });
    setAdded(true);
    toast(`Added to bag · ${p.name}`);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="prod-card" data-name={p.name} data-price={p.price}>
      {/* Media Frame Container */}
      <div className={`prod-card__frame ${p.panel}`}>
        <Link
          className="prod-card__media-link"
          href={`/product/${p.slug}`}
          aria-label={`View ${p.name}`}
        >
          {/* Primary Image */}
          {p.image ? (
            <>
              {!imgLoaded && <div className="skeleton prod-card__skeleton" aria-hidden="true" />}
              <Image
                src={p.gallery?.[0]?.mediumUrl || p.image}
                alt={p.name}
                fill
                priority={priority}
                sizes="(max-width:560px) 50vw, (max-width:900px) 33vw, 280px"
                placeholder={p.gallery?.[0]?.blurDataURL || p.blurDataURL ? "blur" : "empty"}
                blurDataURL={p.gallery?.[0]?.blurDataURL || p.blurDataURL}
                onLoad={() => setImgLoaded(true)}
                className={`prod-card__img prod-card__img--primary${imgLoaded ? " is-loaded" : ""}`}
              />
            </>
          ) : (
            <div className={`motif ${p.tone}`}>
              <svg viewBox={vb(p.motif)}>
                <use href={`#${p.motif}`} />
              </svg>
            </div>
          )}

          {/* Secondary Hover Image (if available) */}
          {secondaryImage && secondaryImage !== p.image && (
            <Image
              src={secondaryImage}
              alt={`${p.name} detail view`}
              fill
              sizes="(max-width:560px) 50vw, (max-width:900px) 33vw, 280px"
              className="prod-card__img prod-card__img--secondary"
            />
          )}
        </Link>

        {/* Badges Stack */}
        <div className="prod-card__badges">
          {p.active === false && <span className="prod-badge unavailable">Unavailable</span>}
          {p.tag && <span className={`prod-badge ${p.tag.toLowerCase()}`}>{p.tag}</span>}
          {discountPercent && <span className="prod-badge discount">-{discountPercent}%</span>}
        </div>

        {/* Wishlist Heart Button */}
        <button
          className={`prod-card__wish ${saved ? "saved" : ""}`}
          type="button"
          aria-label={`Save ${p.name} to wishlist`}
          aria-pressed={saved}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWish(p.id);
            toast(saved ? "Removed from wishlist" : "Saved to wishlist");
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 20s-7-4.6-9.3-9C1.2 8 2.8 4.5 6.2 4.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.5 6.5C19 15.4 12 20 12 20z" />
          </svg>
        </button>

        {/* Quick Add Overlay */}
        <button
          className={`prod-card__qadd ${added ? "added" : ""}`}
          type="button"
          onClick={onAdd}
        >
          {added ? (
            <>
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg> Added to Bag
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg> Quick Add
            </>
          )}
        </button>
      </div>

      {/* Product Details Section below frame */}
      <div className="prod-card__info">
        {/* Category / Fabric Subtitle */}
        <div className="prod-card__category">
          {p.category} {p.fabric ? `· ${p.fabric}` : ""}
        </div>

        {/* Product Title */}
        <Link className="prod-card__title" href={`/product/${p.slug}`}>
          <h3>{p.name}</h3>
        </Link>

        {/* Ratings */}
        <div className="prod-card__rating">
          <span className="stars" aria-hidden="true">{stars(p.rating)}</span>
          <span className="score">{p.rating.toFixed(1)}</span>
          <span className="reviews">({p.reviews})</span>
        </div>

        {/* Pricing */}
        <div className="prod-card__price">
          <span className="current">₹{inr(p.price)}</span>
          {p.oldPrice && <s className="old">₹{inr(p.oldPrice)}</s>}
        </div>


      </div>
    </div>
  );
}
