"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { useDraft } from "@/lib/use-draft";

const STATUSES = ["cod_pending", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "paid"];

export default function OrderStatusControl({
  id,
  status,
  tracking,
  isCod,
  paidAt,
}: {
  id: string;
  status: string;
  tracking?: string;
  isCod: boolean;
  paidAt?: string;
}) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [s, setS] = useState(status);
  const [track, setTrack] = useState(tracking ?? "");
  const [busy, setBusy] = useState(false);
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<{ s: string; track: string }>(`order.${id}`, { s, track });

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: s, tracking: track, ...extra }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Update failed");
      clearDraft();
      toast("Order updated");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-card">
      <span className="adm-eyebrow">Manage</span>
      <h3 style={{ margin: ".2rem 0 1rem" }}>Status &amp; fulfilment</h3>
      {hasDraft && (
        <div
          className="adm-card"
          style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
        >
          <span>Unsaved changes from a previous session were found.</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setS(pending!.s); setTrack(pending!.track); dismiss(); }}>Restore</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
          </span>
        </div>
      )}
      <label className="adm-field">
        <span>Status</span>
        <select className="adm-select" value={s} onChange={(e) => setS(e.target.value)}>
          {STATUSES.map((x) => (
            <option key={x} value={x}>{x.replace("_", " ")}</option>
          ))}
        </select>
      </label>
      <label className="adm-field">
        <span>Tracking number</span>
        <input className="adm-in" value={track} onChange={(e) => setTrack(e.target.value)} placeholder="Courier AWB / tracking id" />
      </label>
      <div className="adm-actions">
        <button className="adm-btn adm-btn--solid" disabled={busy} onClick={() => save()}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {isCod && !paidAt && (
          <button className="adm-btn adm-btn--gold" disabled={busy} onClick={() => save({ markPaid: true })}>
            Mark COD paid
          </button>
        )}
      </div>
    </div>
  );
}
