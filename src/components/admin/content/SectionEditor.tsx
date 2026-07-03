"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { ICON_KEYS } from "@/lib/icon-registry";
import { useDraft } from "@/lib/use-draft";
import type { Field } from "@/lib/admin/content-schema";

type Obj = Record<string, unknown>;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function emptyFor(f: Field): unknown {
  switch (f.type) {
    case "boolean": return false;
    case "number": return 0;
    case "strings": return [];
    case "list": return [];
    case "group": return Object.fromEntries(f.fields.map((x) => [x.key, emptyFor(x)]));
    default: return "";
  }
}

function ImageField({ value, section, onChange }: { value: string; section: string; onChange: (v: string) => void }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", `content/${section}`);
      const res = await fetch("/api/admin/upload", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Upload failed");
      onChange(j.url);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="adm-row" style={{ alignItems: "center" }}>
      {value ? <Image src={value} alt="" width={56} height={70} style={{ objectFit: "cover", borderRadius: 4 }} unoptimized /> : <div className="adm-thumb__ph" style={{ width: 56, height: 70, borderRadius: 4 }} />}
      <input className="adm-in" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/path or URL" style={{ flex: 1 }} />
      <label className="adm-btn adm-btn--ghost adm-btn--sm">
        {busy ? "…" : "Upload"}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
      </label>
    </div>
  );
}

function FieldView({ field, value, section, onChange }: { field: Field; value: unknown; section: string; onChange: (v: unknown) => void }) {
  if (field.type === "text")
    return (<label className="adm-field"><span>{field.label}</span><input className="adm-in" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>);
  if (field.type === "textarea")
    return (<label className="adm-field"><span>{field.label}</span><textarea className="adm-textarea" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>);
  if (field.type === "number")
    return (<label className="adm-field"><span>{field.label}</span><input className="adm-in" type="number" value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} /></label>);
  if (field.type === "boolean")
    return (<label className="adm-field" style={{ flexDirection: "row", alignItems: "center", gap: ".6rem" }}><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /><span>{field.label}</span></label>);
  if (field.type === "icon")
    return (<label className="adm-field"><span>{field.label}</span><select className="adm-select" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>);
  if (field.type === "select")
    return (<label className="adm-field"><span>{field.label}</span><select className="adm-select" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>);
  if (field.type === "image")
    return (<div className="adm-field"><span>{field.label}</span><ImageField value={String(value ?? "")} section={section} onChange={onChange} /></div>);

  if (field.type === "strings") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="adm-field">
        <span>{field.label}</span>
        {arr.map((s, i) => (
          <div className="adm-row" key={i} style={{ marginBottom: ".3rem" }}>
            <input className="adm-in" value={s} onChange={(e) => { const n = [...arr]; n[i] = e.target.value; onChange(n); }} style={{ flex: 1 }} />
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onChange(arr.filter((_, k) => k !== i))}>✕</button>
          </div>
        ))}
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onChange([...arr, ""])}>+ Add</button>
      </div>
    );
  }

  if (field.type === "group") {
    const obj = (value ?? {}) as Obj;
    return (
      <fieldset className="adm-group">
        <legend>{field.label}</legend>
        {field.fields.map((f) => (
          <FieldView key={f.key} field={f} section={section} value={obj[f.key]} onChange={(v) => onChange({ ...obj, [f.key]: v })} />
        ))}
      </fieldset>
    );
  }

  if (field.type === "list") {
    const items = Array.isArray(value) ? (value as Obj[]) : [];
    const setItem = (i: number, v: Obj) => { const n = [...items]; n[i] = v; onChange(n); };
    const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= items.length) return; const n = [...items]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
    const blank = Object.fromEntries(field.fields.map((f) => [f.key, emptyFor(f)]));
    return (
      <div className="adm-field">
        <span>{field.label}</span>
        {items.map((it, i) => (
          <div className="adm-listitem" key={i}>
            <div className="adm-listitem__head">
              <b>{field.itemLabel ?? "Item"} {i + 1}</b>
              <span className="adm-actions">
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => move(i, 1)}>↓</button>
                <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => onChange(items.filter((_, k) => k !== i))}>Remove</button>
              </span>
            </div>
            {field.fields.map((f) => (
              <FieldView key={f.key} field={f} section={section} value={it[f.key]} onChange={(v) => setItem(i, { ...it, [f.key]: v })} />
            ))}
          </div>
        ))}
        <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => onChange([...items, blank])}>
          + Add {field.itemLabel ?? "item"}
        </button>
      </div>
    );
  }

  return null;
}

export default function SectionEditor({ section, fields, initial }: { section: string; fields: Field[]; initial: Obj }) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const router = useRouter();
  const [data, setData] = useState<Obj>(() => clone(initial));
  const [busy, setBusy] = useState(false);
  const { pending, hasDraft, dismiss, clear: clearDraft } = useDraft<Obj>(`content.${section}`, data);

  async function save() {
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/content/${section}`, {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Save failed");
      clearDraft();
      toast("Saved — live now");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-card" style={{ maxWidth: 760 }}>
      {hasDraft && (
        <div
          className="adm-card"
          style={{ display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem", borderColor: "var(--adm-accent, #a9823a)" }}
        >
          <span>Unsaved changes from a previous session were found.</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--solid adm-btn--sm" onClick={() => { setData(pending!); dismiss(); }}>Restore</button>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={clearDraft}>Discard</button>
          </span>
        </div>
      )}
      {fields.map((f) => (
        <FieldView key={f.key} field={f} section={section} value={data[f.key]} onChange={(v) => setData((p) => ({ ...p, [f.key]: v }))} />
      ))}
      <div className="adm-actions" style={{ marginTop: "1rem" }}>
        <button className="adm-btn adm-btn--solid" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}
