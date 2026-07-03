"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";

export default function ProductRowActions({ id }: { id: string }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(method: string, url: string, body?: unknown) {
    setBusy(true);
    try {
      const t = await getToken();
      const res = await fetch(url, {
        method,
        headers: { authorization: `Bearer ${t}`, ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed");
      return j;
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this product permanently?")) return;
    try {
      await call("DELETE", `/api/admin/products/${id}`);
      toast("Deleted");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  return (
    <span className="adm-actions">
      <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={`/admin/products/${id}`}>Edit</Link>
      <button className="adm-btn adm-btn--danger adm-btn--sm" disabled={busy} onClick={remove}>Delete</button>
    </span>
  );
}
