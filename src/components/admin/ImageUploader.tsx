"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import GalleryPicker from "@/components/admin/GalleryPicker";

export interface GItem {
  path: string;
  blurDataURL?: string;
  url?: string;
  thumbUrl?: string;
  mediumUrl?: string;
  fullUrl?: string;
}

export default function ImageUploader({
  value,
  onChange,
  prefix,
}: {
  value: GItem[];
  onChange: (g: GItem[]) => void;
  prefix: string;
}) {
  const { getToken } = useAuth();
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Merge images chosen from the storage library, skipping ones already present.
  function addFromLibrary(items: GItem[]) {
    const have = new Set(value.map((g) => g.path));
    const fresh = items.filter((g) => !have.has(g.path));
    if (!fresh.length) return toast("Already added");
    onChange([...value, ...fresh]);
    toast(`Added ${fresh.length} image${fresh.length > 1 ? "s" : ""}`);
  }

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const token = await getToken();
      const next = [...value];
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("prefix", prefix);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
          body: fd,
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Upload failed");
        next.push({
          path: j.path,
          url: j.url,
          blurDataURL: j.blurDataURL || "",
          thumbUrl: j.thumbUrl,
          mediumUrl: j.mediumUrl,
          fullUrl: j.fullUrl,
        });
      }
      onChange(next);
      toast("Image uploaded");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  const remove = (i: number) => onChange(value.filter((_, k) => k !== i));
  const makePrimary = (i: number) => {
    const n = [...value];
    const [it] = n.splice(i, 1);
    n.unshift(it);
    onChange(n);
  };

  return (
    <div>
      <div className="adm-thumbs">
        {value.map((g, i) => (
          <div className={`adm-thumb${i === 0 ? " is-primary" : ""}`} key={g.path + i}>
            {g.url ? (
              <Image
                src={g.thumbUrl || g.url || ""}
                alt=""
                width={108}
                height={136}
                loading="lazy"
                sizes="108px"
                placeholder={g.blurDataURL ? "blur" : "empty"}
                blurDataURL={g.blurDataURL || undefined}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="adm-thumb__ph" />
            )}
            <div className="adm-thumb__bar">
              <button type="button" title="Move left" onClick={() => move(i, -1)}>‹</button>
              {i !== 0 && <button type="button" title="Make primary" onClick={() => makePrimary(i)}>★</button>}
              <button type="button" title="Remove" onClick={() => remove(i)}>✕</button>
              <button type="button" title="Move right" onClick={() => move(i, 1)}>›</button>
            </div>
            {i === 0 && <span className="adm-thumb__tag">Primary</span>}
          </div>
        ))}

        {/* Single combined tile — opens the modal which has both Upload + Library tabs */}
        <button
          type="button"
          className={`adm-thumb adm-thumb--add${busy ? " is-busy" : ""}`}
          onClick={() => setPickerOpen(true)}
          disabled={busy}
        >
          <span className="adm-thumb--add__icon" aria-hidden="true">{busy ? "⏳" : "+"}</span>
          <span>{busy ? "Uploading…" : "Add images"}</span>
        </button>
      </div>

      <GalleryPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addFromLibrary}
        existing={value.map((g) => g.path)}
        onUpload={add}
        busy={busy}
      />
    </div>
  );
}
