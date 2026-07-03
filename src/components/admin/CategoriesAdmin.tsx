"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { useDraft } from "@/lib/use-draft";
import type { Category } from "@/lib/data/categories";

const PANELS = ["p-maroon", "p-teal", "p-mustard", "p-plum", "p-indigo", "p-terra"];
const TONES = ["m-gold", "m-cream"];
const MOTIFS = ["paisley", "mandala"];

type Form = { name: string; deva: string; cnt: string; image: string; pos: string; panel: string; tone: string; motif: string; subs: string[] };
const BLANK: Form = { name: "", deva: "", cnt: "", image: "", pos: "center top", panel: "p-indigo", tone: "m-gold", motif: "paisley", subs: [] };

export default function CategoriesAdmin({ initial }: { initial: Category[] }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<Form>(BLANK);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<Form>(editing ? `category.${editing}` : "category.new", form);

  async function call(method: string, url: string, body?: unknown) {
    const t = await getToken();
    const r = await fetch(url, { method, headers: { authorization: `Bearer ${t}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Failed");
    return j;
  }

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const t = await getToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "content/categories");
      const r = await fetch("/api/admin/upload", { method: "POST", headers: { authorization: `Bearer ${t}` }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setForm((f) => ({ ...f, image: j.url }));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  // subcategories
  const addSub = () => setForm((f) => ({ ...f, subs: [...f.subs, ""] }));
  const delSub = (i: number) => setForm((f) => ({ ...f, subs: f.subs.filter((_, k) => k !== i) }));
  const setSub = (i: number, v: string) => setForm((f) => ({ ...f, subs: f.subs.map((s, k) => (k === i ? v : s)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast("Name is required");
    if (!form.image.trim()) return toast("A photo is required");
    setBusy(true);
    try {
      const payload = { ...form, subs: form.subs.map((s) => s.trim()).filter(Boolean) };
      if (editing) await call("PUT", `/api/admin/categories/${editing}`, payload);
      else await call("POST", "/api/admin/categories", payload);
      clearDraft();
      toast(editing ? "Category updated" : "Category created");
      setForm(BLANK);
      setEditing(null);
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function edit(c: Category) {
    setEditing(c.id);
    setForm({ name: c.name, deva: c.deva ?? "", cnt: c.cnt ?? "", image: c.image ?? "", pos: c.pos ?? "center top", panel: c.panel ?? "p-indigo", tone: c.tone ?? "m-gold", motif: c.motif ?? "paisley", subs: c.subs ?? [] });
  }
  async function del(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Products keep their current category label.`)) return;
    try { await call("DELETE", `/api/admin/categories/${c.id}`); toast("Deleted"); router.refresh(); } catch (e) { toast((e as Error).message); }
  }

  return (
    <div className="adm-cards-2">
      <div className="adm-card" style={{ height: "fit-content" }}>
        <h3 style={{ marginTop: 0 }}>{editing ? `Edit ${form.name}` : "New category"}</h3>
        {hasDraft && (
          <div
            className="adm-card"
            style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
          >
            <span>Unsaved changes from a previous session were found.</span>
            <span className="adm-actions">
              <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setForm(pending!); dismiss(); }}>Restore</button>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
            </span>
          </div>
        )}
        <form onSubmit={submit}>
          <label className="adm-field"><span>Name *</span>
            <input className="adm-in" value={form.name} placeholder="Sarees" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <div className="adm-field">
            <span>Photo *</span>
            <div className="adm-photo-row">
              {form.image
                ? <Image src={form.image} alt="" width={56} height={70} className="adm-photo-row__img" unoptimized />
                : <div className="adm-photo-row__ph" />}
              <div className="adm-photo-row__main">
                <input className="adm-in" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/path or URL" />
                <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ width: "100%", justifyContent: "center" }}>
                  {uploading ? "…" : "Upload"}
                  <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          <label className="adm-field"><span>Devanagari (optional)</span>
            <input className="adm-in" value={form.deva} placeholder="साड़ी" onChange={(e) => setForm({ ...form, deva: e.target.value })} />
          </label>
          <label className="adm-field"><span>Caption (optional)</span>
            <input className="adm-in" value={form.cnt} placeholder="Banarasi · Organza · Silk" onChange={(e) => setForm({ ...form, cnt: e.target.value })} />
          </label>
          <div className="adm-field">
            <span>Subcategories (optional)</span>
            <div className="adm-swatches" style={{ flexDirection: "column", alignItems: "stretch", gap: ".4rem" }}>
              {form.subs.map((s, i) => (
                <span className="adm-color" key={i} style={{ gap: ".4rem" }}>
                  <input className="adm-in" style={{ flex: 1 }} value={s} placeholder="Korra Silk Suits" onChange={(e) => setSub(i, e.target.value)} />
                  <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => delSub(i)}>✕</button>
                </span>
              ))}
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" style={{ alignSelf: "flex-start" }} onClick={addSub}>+ Add subcategory</button>
            </div>
          </div>
          <label className="adm-field"><span>Image position</span>
            <input className="adm-in" value={form.pos} placeholder="center top" onChange={(e) => setForm({ ...form, pos: e.target.value })} />
          </label>
          <div className="adm-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.2rem 1rem", marginBottom: "0.9rem" }}>
            <label className="adm-field" style={{ marginBottom: 0 }}><span>Panel colour</span>
              <select className="adm-select" value={form.panel} onChange={(e) => setForm({ ...form, panel: e.target.value })}>{PANELS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label className="adm-field" style={{ marginBottom: 0 }}><span>Tone</span>
              <select className="adm-select" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>{TONES.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
            <label className="adm-field" style={{ marginBottom: 0 }}><span>Motif</span>
              <select className="adm-select" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })}>{MOTIFS.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            </label>
          </div>
          <div className="adm-actions">
            <button className="adm-btn adm-btn--solid" disabled={busy || uploading}>{busy ? "Saving…" : editing ? "Update" : "Create"}</button>
            {editing && <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { setEditing(null); setForm(BLANK); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="adm-card adm-categories-list-container">
        <h3 style={{ marginTop: 0 }}>Categories ({initial.length})</h3>
        {initial.length === 0 ? <p className="adm-muted">No categories yet — create one to populate the homepage rail and product options.</p> : (
          <>
            <table className="adm-table desktop-only">
              <thead><tr><th></th><th>Name</th><th>Subcategories</th><th></th></tr></thead>
              <tbody>
                {initial.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Photo">{c.image ? <Image src={c.image} alt="" width={40} height={50} style={{ objectFit: "cover", borderRadius: 4 }} unoptimized /> : null}</td>
                    <td data-label="Name"><b>{c.name}</b>{c.deva ? <><br /><small className="adm-muted">{c.deva}</small></> : null}</td>
                    <td data-label="Subcategories"><small className="adm-muted">{(c.subs?.length ?? 0) > 0 ? `${c.subs.length} subcategories` : "—"}</small></td>
                    <td style={{ textAlign: "right" }}>
                      <span className="adm-actions">
                        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => edit(c)}>Edit</button>
                        <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(c)}>Del</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Categories Card List */}
            <div className="adm-categories-mobile-list mobile-only">
              {initial.map((c) => (
                <div key={c.id} className="adm-category-card-mobile">
                  {c.image ? (
                    <Image src={c.image} alt="" width={170} height={110} className="adm-category-card-mobile__img" unoptimized />
                  ) : (
                    <div className="adm-category-card-mobile__img-placeholder" />
                  )}
                  <div className="adm-category-card-mobile__meta">
                    <span className="adm-category-card-mobile__name">{c.name}</span>
                    {c.deva && <span className="adm-category-card-mobile__deva">{c.deva}</span>}
                    {c.cnt && <span className="adm-category-card-mobile__caption">{c.cnt}</span>}
                    {(c.subs?.length ?? 0) > 0 && <span className="adm-category-card-mobile__caption">{c.subs.length} subcategories</span>}
                  </div>
                  <div className="adm-category-card-mobile__actions">
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => edit(c)}>Edit</button>
                    <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => del(c)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
