"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useGallery, type GalleryItem } from "@/components/admin/useGallery";
import type { GItem } from "@/components/admin/ImageUploader";

/**
 * Modal that browses ALL product images already in Firebase Storage and lets the
 * admin select existing ones to attach to a gallery (product- or variant-level),
 * instead of re-uploading. Paginated via "Load more".
 */
export default function GalleryPicker({
  open,
  onClose,
  onSelect,
  existing = [],
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: GItem[]) => void;
  /** paths already on the gallery — shown as "added" and not selectable */
  existing?: string[];
}) {
  const { images, loading, error, hasMore, load } = useGallery("", 60);
  const [selected, setSelected] = useState<Record<string, GalleryItem>>({});
  const added = new Set(existing);

  // Load the first page each time the modal opens. (Selection is cleared on close,
  // so it starts empty — avoids a synchronous setState inside this effect.)
  useEffect(() => {
    if (open) load(true);
    // `load` is stable (cursor lives in a ref); we only want to (re)load on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const close = () => {
    setSelected({});
    onClose();
  };

  const toggle = (img: GalleryItem) => {
    if (added.has(img.path)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[img.path]) delete next[img.path];
      else next[img.path] = img;
      return next;
    });
  };

  const chosen = Object.values(selected);
  const confirm = () => {
    onSelect(chosen.map((i) => ({ path: i.path, url: i.url, blurDataURL: "" })));
    close();
  };

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="adm-modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal__head">
          <div>
            <div className="adm-modal__title">Image library</div>
            <div className="adm-modal__sub">
              {images.length} loaded{chosen.length ? ` · ${chosen.length} selected` : ""}
            </div>
          </div>
          <button type="button" className="adm-modal__close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="adm-modal__body">
          {error && <p className="adm-sub" style={{ color: "var(--danger, #b23)" }}>{error}</p>}
          {images.length === 0 && !loading && !error && (
            <p className="adm-sub">No images in storage yet. Upload some with “+ Add”.</p>
          )}
          <div className="adm-picker-grid">
            {images.map((img) => {
              const isAdded = added.has(img.path);
              const isSel = Boolean(selected[img.path]);
              return (
                <button
                  type="button"
                  key={img.name}
                  className={`adm-pick${isSel ? " is-selected" : ""}${isAdded ? " is-added" : ""}`}
                  onClick={() => toggle(img)}
                  title={img.path}
                >
                  <Image src={img.url} alt="" width={120} height={160} unoptimized />
                  {isAdded && <span className="adm-pick__added">Added</span>}
                  {isSel && <span className="adm-pick__check">✓</span>}
                </button>
              );
            })}
          </div>
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button type="button" className="adm-btn adm-btn--ghost" disabled={loading} onClick={() => load(false)}>
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>

        <div className="adm-modal__foot">
          <span className="adm-modal__sub">{chosen.length} selected</span>
          <span className="adm-actions">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={close}>Cancel</button>
            <button type="button" className="adm-btn adm-btn--solid" disabled={!chosen.length} onClick={confirm}>
              Add selected
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
