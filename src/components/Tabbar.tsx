"use client";

import Link from "next/link";
import { useStore } from "./StoreProvider";

export default function Tabbar() {
  const { bagCount, savedCount } = useStore();
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      <ul>
        <li>
          <Link href="/shop" className="active">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Shop
          </Link>
        </li>
        <li>
          <Link href="/shop?sort=new">
            <svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" /></svg>
            New
          </Link>
        </li>
        <li>
          <Link href="/wishlist" style={{ position: "relative" }}>
            <span className="bc sc" hidden={savedCount === 0}>{savedCount}</span>
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9.3-9C1.2 8 2.8 4.5 6.2 4.5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.5 6.5C19 15.4 12 20 12 20z" /></svg>
            Saved
          </Link>
        </li>
        <li>
          <Link href="/cart" style={{ position: "relative" }}>
            <span className="bc" hidden={bagCount === 0}>{bagCount}</span>
            <svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
            Bag
          </Link>
        </li>
      </ul>
    </nav>
  );
}
