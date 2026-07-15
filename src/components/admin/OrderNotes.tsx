"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { useDraft } from "@/lib/use-draft";

/** Internal staff note on an order. Never shown to the customer. */
export default function OrderNotes({ id, notes }: { id: string; notes?: string }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [text, setText] = useState(notes ?? "");
  const [busy, setBusy] = useState(false);
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<string>(`order-notes.${id}`, text);

  async function save() {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not save note");
      clearDraft();
      toast("Note saved");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-card no-print">
      <span className="adm-eyebrow">Internal</span>
      <h3 style={{ margin: ".2rem 0 .8rem" }}>Staff notes</h3>
      {hasDraft && (
        <div
          className="adm-card"
          style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--gold)" }}
        >
          <span>An unsaved note from a previous session was found.</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setText(pending ?? ""); dismiss(); }}>Restore</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
          </span>
        </div>
      )}
      <label className="adm-field">
        <span>Note</span>
        <textarea
          className="adm-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={5000}
          placeholder="Visible to admins only — e.g. customer called to change the size, courier picked up on Tuesday."
        />
      </label>
      <div className="adm-actions">
        <button className="adm-btn adm-btn--solid" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save note"}
        </button>
        <span className="adm-muted" style={{ fontSize: ".8rem" }}>{text.length}/5000</span>
      </div>
    </div>
  );
}
