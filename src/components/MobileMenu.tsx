"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./StoreProvider";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import type { Category } from "@/lib/data/categories";

type Group = { label: string; links: { label: string; href: string }[] };

export default function MobileMenu({ groups = CONTENT_DEFAULTS.navigation.mobileGroups, categories = [] }: { groups?: Group[]; categories?: Category[] }) {
  const { menuOpen, setMenuOpen } = useStore();
  const [open, setOpen] = useState<number | null>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
    setMenuOpen(false);
    setQuery("");
  };

  // Replace the hardcoded "Shop" group with the admin-managed categories.
  const navGroups = categories.length > 0
    ? groups.map((g) =>
        g.label.toLowerCase() === "shop"
          ? {
              ...g,
              links: [
                ...categories.map((c) => ({ label: c.name, href: `/shop?cat=${encodeURIComponent(c.name)}` })),
                { label: "Shop all", href: "/shop" },
              ],
            }
          : g
      )
    : groups;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [setMenuOpen]);

  return (
    <div className={`m-menu${menuOpen ? " open" : ""}`} id="mMenu" aria-hidden={!menuOpen}>
      <div className="m-menu__top">
        <span className="brand"><b className="deva">तमक</b></span>
        <button className="m-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
          <span /><span />
        </button>
      </div>
      <div className="m-menu__body">
        <form className="m-search" role="search" onSubmit={handleSearch}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            type="search"
            placeholder="Search sarees, kurtas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </form>
        {navGroups.map((g, i) => (
          <div className={`m-acc${open === i ? " open" : ""}`} key={g.label}>
            <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {g.label} <span className="pm">+</span>
            </button>
            <div className="m-acc__sub" style={{ maxHeight: open === i ? `${g.links.length * 48}px` : 0 }}>
              {g.links.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
              ))}
            </div>
          </div>
        ))}
        <div className="m-foot">
          <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
          <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
          <Link href="/account" onClick={() => setMenuOpen(false)}>Track Order</Link>
          <Link href="/#visit" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      </div>
    </div>
  );
}
