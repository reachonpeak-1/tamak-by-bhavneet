"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AdminTopbar({ email, onMenuOpen }: { email: string; onMenuOpen?: () => void }) {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
      await signOut().catch(() => {});
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <header className="adm-topbar">
      {onMenuOpen && (
        <button className="adm-topbar__menu-btn" onClick={onMenuOpen} aria-label="Open sidebar">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <div className="adm-topbar__sp" />
      <div className="adm-topbar__user">
        <span className="adm-topbar__email">{email}</span>
        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={onSignOut} disabled={busy}>
          {busy ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
