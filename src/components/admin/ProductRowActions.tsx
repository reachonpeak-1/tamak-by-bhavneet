"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/types";

export default function ProductRowActions({ product }: { product: Product }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(product.active ?? true);

  async function toggleActive(newVal: boolean) {
    setBusy(true);
    try {
      const token = await getToken();
      const payload = {
        ...product,
        active: newVal,
      };
      
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to update status");
      
      setActive(newVal);
      toast(newVal ? "Product is now Active (visible)" : "Product is now Inactive (hidden)");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="adm-actions" style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem" }}>
      <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/products/${product.id}`}>Edit</Link>
      <label className="adm-switch" style={{ transform: "scale(0.85)", margin: 0 }} title={active ? "Active (Visible)" : "Inactive (Hidden)"}>
        <input type="checkbox" checked={active} disabled={busy} onChange={(e) => toggleActive(e.target.checked)} />
        <span className="adm-switch-slider" />
      </label>
    </span>
  );
}
