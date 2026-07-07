"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import ImageUploader, { type GItem } from "@/components/admin/ImageUploader";
import type { Category } from "@/lib/data/categories";
import { useDraft } from "@/lib/use-draft";

const PANELS = ["p-maroon", "p-teal", "p-mustard", "p-plum", "p-indigo", "p-terra"];
const MOTIFS = ["paisley", "mandala"];
const TONES = ["m-gold", "m-cream"];
const TAGS = ["", "New", "Sale", "Bestseller"];

type Draft = Omit<Partial<Product>, "gallery" | "variants"> & { gallery: GItem[]; variants: never[]; active?: boolean };

export default function ProductEditor({ product, categories = [] }: { product?: Product; categories?: Category[] }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const isNew = !product;
  const [prefix] = useState(() => product?.id ?? `new-${Date.now()}`);
  // Category options come from the admin-managed categories collection; keep the
  // product's existing value selectable even if that category was later removed.
  const catNames = categories.map((c) => c.name);
  const catOptions = Array.from(new Set([...catNames, product?.category].filter(Boolean) as string[]));
  const [d, setD] = useState<Draft>(() => {
    const p = product;
    return {
      name: p?.name ?? "", slug: p?.slug ?? "", fabric: p?.fabric ?? "", price: p?.price ?? 0,
      oldPrice: p?.oldPrice, tag: p?.tag ?? "", category: p?.category ?? catNames[0] ?? "", subcategory: p?.subcategory ?? "",
      gender: p?.gender ?? "Women", description: p?.description ?? "", keywords: p?.keywords ?? "",
      stock: p?.stock ?? 5, rating: p?.rating ?? 4.6,
      reviews: p?.reviews ?? 0, panel: p?.panel ?? "p-indigo",
      motif: p?.motif ?? "paisley", tone: p?.tone ?? "m-gold",
      gallery: (p?.gallery as GItem[]) ?? [],
      variants: [],
      active: p?.active ?? true,
    };
  });
  const [busy, setBusy] = useState(false);

  // Persist in-progress edits so a network failure / tab close / reload doesn't lose them.
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<Draft>(
    product ? `product.${product.id}` : "product.new",
    d,
  );

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  // Subcategory options follow the selected category; keep the product's current
  // value selectable even if it was later removed. Empty "" = no subcategory.
  const activeCatSubs = categories.find((c) => c.name === d.category)?.subs ?? [];
  const subOptions = Array.from(new Set(["", ...activeCatSubs, d.subcategory].filter((v) => v !== undefined) as string[]));


  async function save() {
    if (!d.name?.trim()) return toast("Name is required");
    setBusy(true);
    try {
      const token = await getToken();
      const payload = {
        ...d,
      };
      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${product!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      clearDraft();
      toast(isNew ? "Product created" : "Saved");
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this product permanently?")) return;
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/products/${product!.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Delete failed");
      clearDraft();
      toast("Deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const Text = (label: string, k: keyof Draft, ph = "") => (
    <label className="adm-field">
      <span>{label}</span>
      <input className="adm-in" value={String(d[k] ?? "")} placeholder={ph} onChange={(e) => set(k, e.target.value as Draft[typeof k])} />
    </label>
  );
  const Number_ = (label: string, k: keyof Draft) => (
    <label className="adm-field">
      <span>{label}</span>
      <input className="adm-in" type="number" value={Number(d[k] ?? 0)} onChange={(e) => set(k, Number(e.target.value) as Draft[typeof k])} />
    </label>
  );
  const Select = (label: string, k: keyof Draft, opts: string[]) => (
    <label className="adm-field">
      <span>{label}</span>
      <select className="adm-select" value={String(d[k] ?? "")} onChange={(e) => set(k, e.target.value as Draft[typeof k])}>
        {opts.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </label>
  );
  const Checkbox = (label: string, k: keyof Draft) => (
    <div className="adm-field">
      <span>{label}</span>
      <div style={{ display: "flex", alignItems: "center", minHeight: "38px" }}>
        <label className="adm-switch">
          <input
            type="checkbox"
            checked={!!d[k]}
            onChange={(e) => set(k, e.target.checked as Draft[typeof k])}
          />
          <span className="adm-switch-slider" />
        </label>
      </div>
    </div>
  );

  return (
    <div className="adm-card" style={{ maxWidth: 880 }}>
      {hasDraft && (
        <div
          className="adm-card"
          style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
        >
          <span>Unsaved changes from a previous session were found.</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setD(pending!); dismiss(); }}>Restore</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
          </span>
        </div>
      )}
      <div className="adm-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: ".2rem 1rem" }}>
        {Text("Name", "name", "Black Anarkali Suit")}
        {Text("Slug (URL — auto from name if blank)", "slug", "black-anarkali-suit")}
        {Text("Fabric / descriptor", "fabric", "Silk · Zari embroidery")}
        {Number_("Price (₹)", "price")}
        {Number_("Old price (₹, optional)", "oldPrice")}
        <label className="adm-field">
          <span>Category</span>
          <select
            className="adm-select"
            value={String(d.category ?? "")}
            onChange={(e) => {
              const cat = e.target.value;
              const subs = categories.find((c) => c.name === cat)?.subs ?? [];
              setD((p) => ({ ...p, category: cat, subcategory: subs.includes(p.subcategory ?? "") ? p.subcategory : "" }));
            }}
          >
            {catOptions.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span>Subcategory</span>
          <select
            className="adm-select"
            value={String(d.subcategory ?? "")}
            disabled={activeCatSubs.length === 0}
            onChange={(e) => set("subcategory", e.target.value)}
          >
            {subOptions.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
          </select>
        </label>
        {Select("Tag", "tag", TAGS)}
        {Select("Gender", "gender", ["Women", "Men", "Unisex"])}
        {Number_("Stock", "stock")}
        {Number_("Reviews", "reviews")}
        {Number_("Rating (0–5)", "rating")}
        {Select("Panel (placeholder)", "panel", PANELS)}
        {Select("Motif", "motif", MOTIFS)}
        {Select("Tone", "tone", TONES)}
      </div>

      <label className="adm-field">
        <span>Keywords</span>
        <input className="adm-in" value={d.keywords ?? ""} onChange={(e) => set("keywords", e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Description</span>
        <textarea className="adm-textarea" value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} />
      </label>

      <div className="adm-field">
        <span>Images (first is primary)</span>
        <ImageUploader value={d.gallery} prefix={prefix} onChange={(g) => set("gallery", g)} />
      </div>

      <div className="adm-actions" style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "0.8rem" }}>
          <button className="adm-btn adm-btn--solid" disabled={busy} onClick={save}>
            {busy ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
          <button className="adm-btn adm-btn--ghost" type="button" onClick={() => router.push("/admin/products")}>Cancel</button>
        </div>
        {!isNew && (
          <button className="adm-btn adm-btn--danger" type="button" disabled={busy} onClick={remove}>
            Delete product
          </button>
        )}
      </div>
    </div>
  );
}
