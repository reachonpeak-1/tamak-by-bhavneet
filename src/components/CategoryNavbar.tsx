"use client";

import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/data/categories";

interface CategoryNavbarProps {
  categories: Category[];
  activeCat?: string;
}

const DEVA_FALLBACKS: Record<string, string> = {
  "BANARSEE": "बनारसी",
  "CHIKANKARI": "चिकनकारी",
  "IKKAT": "इक्कत",
  "KALAMKARI": "कलमकारी",
  "PHULKARI": "फुलकारी",
  "RAJKOT PATOLAS": "पटोला",
  "AJRAKH": "अजरख",
  "PAITHNI": "पैठणी",
  "LAMBANI": "लम्बानी",
  "KANTHA": "कांथा",
  "SOZNI/KASHMIRI": "सोज़नी",
  "BANDHEJ": "बंधेज",
  "KURTAS": "कुर्ता",
  "SAREES": "साड़ी",
  "SUITS": "सूट",
  "DUPATTAS": "दुपट्टा",
};

export default function CategoryNavbar({ categories = [], activeCat }: CategoryNavbarProps) {
  const sorted = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="cat-nav-wrapper">
      <div className="cat-nav-scroll">
        {/* "Shop All" Category Tab */}
        <Link
          href="/shop"
          className={`cat-nav-item${!activeCat ? " active" : ""}`}
        >
          <div className="cat-nav-thumb cat-nav-thumb--all">
            <span className="deva">तमक</span>
          </div>
          <div className="cat-nav-meta">
            <span className="deva">सब वस्त्र</span>
            <span className="eng">Shop All</span>
          </div>
        </Link>

        {/* Dynamic Categories */}
        {sorted.map((c) => {
          const isActive = activeCat?.toLowerCase() === c.name.toLowerCase();
          const devaLabel = c.deva || DEVA_FALLBACKS[c.name.toUpperCase()] || c.name;
          const firstChar = devaLabel.charAt(0);

          return (
            <Link
              key={c.id}
              href={`/shop?cat=${encodeURIComponent(c.name)}`}
              className={`cat-nav-item${isActive ? " active" : ""}`}
            >
              <div className="cat-nav-thumb">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    width={44}
                    height={44}
                    className="cat-nav-img"
                    unoptimized
                  />
                ) : (
                  <span className={`cat-nav-panel-fallback ${c.panel || "p-indigo"}`}>
                    {firstChar}
                  </span>
                )}
              </div>
              <div className="cat-nav-meta">
                <span className="deva">{devaLabel}</span>
                <span className="eng">{c.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
