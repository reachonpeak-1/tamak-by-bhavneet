"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "./StoreProvider";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import type { Category } from "@/lib/data/categories";

type NavItem = { label: string; href: string; drop?: { label: string; href: string }[] };

const DEVA_MAP: Record<string, string> = {
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

export default function Header({ nav = CONTENT_DEFAULTS.navigation.primary, categories = [] }: { nav?: NavItem[]; categories?: Category[] }) {
  const [scrolled, setScrolled] = useState(false);
  const { bagCount, savedCount, setMenuOpen } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header${scrolled ? " scrolled" : ""}`} id="header">
      <nav className="nav wrap" aria-label="Primary">
        <Link className="brand" href="/" aria-label="तमक by Bhavneet — home">
          <Image src="/brand/logo.png" alt="तमक by Bhavneet" width={46} height={46} priority />
          <span className="wm">
            <b className="deva">तमक</b>
            <small>By Bhavneet</small>
          </span>
        </Link>
        <ul className="nav-list">
          {nav.map((item, i) => {
            const isMega = item.label === "Shop" && categories.length > 0;
            const hasDrop = !isMega && !!item.drop && item.drop.length > 0;
            return (
              <li key={i} className={isMega ? "has-mega" : undefined}>
                <Link className="top" href={item.href}>
                  {item.label}
                  {(isMega || hasDrop) && (
                    <svg viewBox="0 0 10 10"><path d="M1 3l4 4 4-4" /></svg>
                  )}
                </Link>
                {isMega && (
                  <div className="mega">
                    <div className="mega-inner">
                      <Link className="mega-feature" href="/shop?sort=new">
                        <span className="mega-feature__eyebrow">New In</span>
                        <span className="mega-feature__title">New Arrivals</span>
                        <span className="mega-feature__copy">The latest handwoven pieces, fresh off the loom.</span>
                        <span className="mega-feature__cta">Shop all new →</span>
                      </Link>
                      
                      <div className="mega-col">
                        <h4 className="mega-col__title">Shop by Category</h4>
                        <div className="mega-col__grid">
                          {categories.map((c) => {
                            const devaLabel = c.deva || DEVA_MAP[c.name.toUpperCase()] || c.name;
                            return (
                              <Link className="mega-card" key={c.id} href={`/shop?cat=${encodeURIComponent(c.name)}`}>
                                <div className="mega-card__img-wrap">
                                  {c.image ? (
                                    <Image className="mega-card__thumb" src={c.image} alt={c.name} width={150} height={110} unoptimized />
                                  ) : (
                                    <span className={`mega-card__thumb mega-card__thumb--text ${c.panel || "p-indigo"}`}>{c.name}</span>
                                  )}
                                </div>
                                <div className="mega-card__meta">
                                  <span className="deva">{devaLabel}</span>
                                  <span className="eng">{c.name}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mega-col">
                        <h4 className="mega-col__title">Shop by Occasion</h4>
                        <ul className="mega-col__list">
                          <li>
                            <Link href="/shop?occasion=Bridal">
                              <span>Bridal Edit</span>
                              <small>Handcrafted bridal elegance</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?occasion=Festive">
                              <span>Festive Wear</span>
                              <small>Zari weaves & vibrant tones</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?occasion=Everyday">
                              <span>Everyday Luxe</span>
                              <small>Mul-cotton & light fabrics</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?occasion=Reception">
                              <span>Reception Edit</span>
                              <small>Modern fusion silhouettes</small>
                            </Link>
                          </li>
                        </ul>
                      </div>

                      <div className="mega-col">
                        <h4 className="mega-col__title">Explore our Craft</h4>
                        <ul className="mega-col__list craft-list">
                          <li>
                            <Link href="/shop?cat=BANARSEE">
                              <span>Banarasi Zari</span>
                              <small>Metallic threads woven in fine silk</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?cat=CHIKANKARI">
                              <span>Chikankari</span>
                              <small>Intricate hand embroidery from Lucknow</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?cat=IKKAT">
                              <span>Ikkat Weaves</span>
                              <small>Tie-dyed warp & weft patterns</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?cat=AJRAKH">
                              <span>Ajrakh Prints</span>
                              <small>Natural-dyed traditional block prints</small>
                            </Link>
                          </li>
                          <li>
                            <Link href="/shop?cat=RAJKOT+PATOLAS">
                              <span>Patola Silks</span>
                              <small>Double-ikkat masterpiece heritage silks</small>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {hasDrop && (
                  <div className="drop">
                    {item.drop!.map((d, j) => (
                      <Link key={j} href={d.href}>{d.label}</Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <span className="nav-spacer" />
        <div className="actions">
          <Link href="/shop" aria-label="Search">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </Link>
          <Link className="a-account" href="/account" aria-label="Account">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </Link>
          <Link className="a-wish" href="/wishlist" aria-label="Wishlist">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9.3-9C1.2 8 2.8 4.5 6.2 4.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.5 6.5C19 15.4 12 20 12 20z" /></svg>
            <span className="wish-count" hidden={savedCount === 0}>{savedCount}</span>
          </Link>
          <Link href="/cart" aria-label="Shopping bag">
            <svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
            <span className="bag-count" hidden={bagCount === 0}>{bagCount}</span>
          </Link>
          <button className="burger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </header>
  );
}
