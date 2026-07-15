"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { ORDER_STATUSES } from "@/lib/data/order-status";

export default function OrderRowStatus({ id, status }: { id: string; status: string }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [s, setS] = useState(status);
  const [busy, setBusy] = useState(false);

  async function change(newStatus: string) {
    const prev = s;
    setS(newStatus);
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Update failed");
      toast("Order updated");
      router.refresh();
    } catch (e) {
      setS(prev);
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className={`adm-pill adm-pill--${s}`}
      style={{ width: "auto", border: "none", cursor: "pointer" }}
      value={s}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
    >
      {ORDER_STATUSES.map((x) => (
        <option key={x} value={x}>{x.replace("_", " ")}</option>
      ))}
    </select>
  );
}
