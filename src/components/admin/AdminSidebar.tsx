"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; icon: string }[] = [
  { href: "/admin", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/admin/orders", label: "Orders", icon: "M6 2l1.5 2h9L18 2M3 6h18l-1.5 14h-15L3 6zm6 4v6m6-6v6" },
  { href: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7M12 11v10" },
  { href: "/admin/media", label: "Media", icon: "M3 5h18v14H3V5zm0 11l5-5 4 4 3-3 4 4M9 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" },
  { href: "/admin/categories", label: "Categories", icon: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" },
  { href: "/admin/content", label: "Content", icon: "M4 5h16M4 12h16M4 19h10" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "M3 6h18v12H3zM3 7l9 6 9-6" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "M4 4h16v16H4zM4 8h16M8 12h8M8 16h5" },
  { href: "/admin/customers", label: "Customers", icon: "M12 8a4 4 0 100-8 4 4 0 000 8zm-8 13c0-4 3.6-7 8-7s8 3 8 7" },
  { href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm8-3a8 8 0 00-.2-1.8l2-1.6-2-3.4-2.4 1a8 8 0 00-3-1.8L14 1h-4l-.4 2.6a8 8 0 00-3 1.8l-2.4-1-2 3.4 2 1.6A8 8 0 004 12a8 8 0 00.2 1.8l-2 1.6 2 3.4 2.4-1a8 8 0 003 1.8L10 23h4l.4-2.6a8 8 0 003-1.8l2.4 1 2-3.4-2-1.6A8 8 0 0020 12z" },
  { href: "/admin/audit", label: "Audit log", icon: "M9 5h6M9 9h6M9 13h4M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`adm-side ${isOpen ? "is-open" : ""}`}>
      <div className="adm-side__header">
        <Link href="/admin" className="adm-side__brand" style={{ alignItems: "center" }} onClick={handleLinkClick}>
          <img src="/brand/logo.png" alt="तमक" width="32" height="32" style={{ borderRadius: "50%" }} />
          <span className="deva" style={{ marginLeft: ".2rem" }}>तमक</span>
          <small>Admin</small>
        </Link>
        {onClose && (
          <button className="adm-side__close" onClick={onClose} aria-label="Close sidebar">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
      <nav className="adm-nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`adm-nav__item${isActive(n.href) ? " is-active" : ""}`} onClick={handleLinkClick}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.icon} /></svg>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
      <Link href="/" className="adm-nav__item adm-nav__store" onClick={handleLinkClick}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12l9-9 9 9M5 10v10h14V10" /></svg>
        <span>View store</span>
      </Link>
    </aside>
  );
}
