"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { useDraft } from "@/lib/use-draft";
import type { Settings } from "@/lib/data/settings";

export default function SettingsEditor({ initial }: { initial: Settings }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<Settings>("settings", s);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    try {
      const t = await getToken();
      const r = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
        body: JSON.stringify(s),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Save failed");
      clearDraft();
      toast("Settings saved");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Txt = (label: string, k: keyof Settings) => (
    <label className="adm-field"><span>{label}</span><input className="adm-in" value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as Settings[typeof k])} /></label>
  );
  const Num = (label: string, k: keyof Settings, hint?: string) => (
    <label className="adm-field"><span>{label}{hint ? ` (${hint})` : ""}</span><input className="adm-in" type="number" value={Number(s[k] ?? 0)} onChange={(e) => set(k, Number(e.target.value) as Settings[typeof k])} /></label>
  );

  return (
    <div className="adm-card" style={{ maxWidth: 680 }}>
      {hasDraft && (
        <div
          className="adm-card"
          style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
        >
          <span>Unsaved changes from a previous session were found.</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setS(pending!); dismiss(); }}>Restore</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
          </span>
        </div>
      )}
      <fieldset className="adm-group"><legend>Store</legend>
        {Txt("Store name", "storeName")}
        {Txt("Contact email", "email")}
        {Txt("Contact phone", "phone")}
        {Txt("WhatsApp number", "whatsapp")}
      </fieldset>

      <fieldset className="adm-group"><legend>Checkout</legend>
        <label className="adm-field"><span>Razorpay mode</span>
          <select className="adm-select" value={s.razorpayMode} onChange={(e) => set("razorpayMode", e.target.value as Settings["razorpayMode"])}>
            <option value="test">Test</option><option value="live">Live</option>
          </select>
        </label>
        {Num("Free shipping threshold", "freeShipThreshold", "₹, 0 = always free")}
        {Num("Flat shipping", "flatShipping", "₹ under threshold")}
        {Num("Tax", "taxPercent", "%, 0 = none")}
      </fieldset>

      <label className="adm-field"><span>Returns policy text</span><textarea className="adm-textarea" value={s.returnsText} onChange={(e) => set("returnsText", e.target.value)} /></label>

      <div className="adm-actions" style={{ marginTop: ".6rem" }}>
        <button className="adm-btn adm-btn--solid" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
      </div>
    </div>
  );
}
