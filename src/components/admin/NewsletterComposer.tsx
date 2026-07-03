"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { useDraft } from "@/lib/use-draft";
import { inr } from "@/lib/format";
import { TEMPLATES, TEMPLATE_BY_ID, type TemplateId } from "@/lib/email/template-config";
import type { Campaign } from "@/lib/data/campaigns";

type SlimProduct = { id: string; name: string; image: string | null; price: number; tag: string | null };
type Counts = { total: number; active: number };
type NewsletterDraft = { template: TemplateId; subject: string; fields: Record<string, string>; auto: boolean; picked: string[] };

export default function NewsletterComposer({ products, campaigns, counts }: { products: SlimProduct[]; campaigns: Campaign[]; counts: Counts }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();

  const [template, setTemplate] = useState<TemplateId>("new-arrivals");
  const def = TEMPLATE_BY_ID[template];
  const [subject, setSubject] = useState(def.defaultSubject);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [auto, setAuto] = useState(true); // auto-pull latest "New" products
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const snap = useMemo<NewsletterDraft>(
    () => ({ template, subject, fields, auto, picked: Array.from(picked) }),
    [template, subject, fields, auto, picked],
  );
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<NewsletterDraft>("newsletter.draft", snap);

  function changeTemplate(id: TemplateId) {
    setTemplate(id);
    setSubject(TEMPLATE_BY_ID[id].defaultSubject);
    setFields({});
  }
  const setField = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));
  const togglePick = (id: string) =>
    setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function send(test: boolean) {
    if (!subject.trim()) return toast("Subject is required");
    if (def.useProducts && !auto && picked.size === 0) return toast("Pick at least one product, or switch to auto");
    if (!test && !confirm(`Send "${subject}" to all ${counts.active} active subscribers?`)) return;

    setBusy(true);
    try {
      const token = await getToken();
      const productIds = def.useProducts && !auto ? products.filter((p) => picked.has(p.id)).map((p) => p.id) : undefined;
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ template, subject, fields, productIds, test }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Send failed");
      toast(test ? `Test sent to your email (${j.sentCount} ok)` : `Sent to ${j.sentCount}/${j.recipientCount}${j.failedCount ? `, ${j.failedCount} failed` : ""}`);
      if (!test) { clearDraft(); router.refresh(); }
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-cards-2">
      <div className="adm-card" style={{ height: "fit-content" }}>
        <h3 style={{ marginTop: 0 }}>Compose</h3>

        {hasDraft && (
          <div
            className="adm-card"
            style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
          >
            <span>Unsaved changes from a previous session were found.</span>
            <span className="adm-actions">
              <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setTemplate(pending!.template); setSubject(pending!.subject); setFields(pending!.fields); setAuto(pending!.auto); setPicked(new Set(pending!.picked)); dismiss(); }}>Restore</button>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
            </span>
          </div>
        )}

        <label className="adm-field"><span>Template</span>
          <select className="adm-select" value={template} onChange={(e) => changeTemplate(e.target.value as TemplateId)}>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>

        <label className="adm-field"><span>Subject</span>
          <input className="adm-in" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
        </label>

        {def.fields.map((f) => (
          <label className="adm-field" key={f.key}>
            <span>{f.label}</span>
            {f.type === "textarea"
              ? <textarea className="adm-textarea" value={fields[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />
              : <input className="adm-in" value={fields[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setField(f.key, e.target.value)} />}
          </label>
        ))}

        {def.useProducts && (
          <div className="adm-field">
            <span>Products</span>
            <label className="adm-field" style={{ flexDirection: "row", alignItems: "center", gap: ".6rem" }}>
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <span>Auto — use latest “New” arrivals</span>
            </label>
            {!auto && (
              <div className="adm-listitem" style={{ maxHeight: 320, overflow: "auto" }}>
                {products.length === 0 ? <p className="adm-muted">No products yet.</p> : products.map((p) => (
                  <label key={p.id} className="adm-row" style={{ alignItems: "center", gap: ".6rem", padding: ".25rem 0" }}>
                    <input type="checkbox" checked={picked.has(p.id)} onChange={() => togglePick(p.id)} />
                    {p.image ? <Image src={p.image} alt="" width={32} height={40} style={{ objectFit: "cover", borderRadius: 3 }} unoptimized /> : <span className="adm-thumb__ph" style={{ width: 32, height: 40, borderRadius: 3 }} />}
                    <span style={{ flex: 1 }}>{p.name}{p.tag ? <small className="adm-muted"> · {p.tag}</small> : null}</span>
                    <span className="adm-muted">₹{inr(p.price)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="adm-actions" style={{ marginTop: "1rem" }}>
          <button className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => send(true)}>Send test to my email</button>
          <button className="adm-btn adm-btn--solid" disabled={busy || counts.active === 0} onClick={() => send(false)}>
            {busy ? "Sending…" : `Send to all (${counts.active})`}
          </button>
        </div>
      </div>

      <div className="adm-card">
        <h3 style={{ marginTop: 0 }}>Campaign history</h3>
        {campaigns.length === 0 ? <p className="adm-muted">No campaigns sent yet.</p> : (
          <table className="adm-table">
            <thead><tr><th>Subject</th><th>Template</th><th>Sent</th><th>When</th></tr></thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td data-label="Subject">{c.subject}</td>
                  <td data-label="Template"><small className="adm-muted">{TEMPLATE_BY_ID[c.template]?.label ?? c.template}</small></td>
                  <td data-label="Sent">{c.sentCount}/{c.recipientCount}{c.failedCount ? <small className="adm-muted"> ({c.failedCount} failed)</small> : null}</td>
                  <td data-label="When">{c.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
