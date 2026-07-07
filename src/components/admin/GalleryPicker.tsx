"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGallery, type GalleryItem } from "@/components/admin/useGallery";
import type { GItem } from "@/components/admin/ImageUploader";

/**
 * Modal that browses ALL product images already in Firebase Storage and lets the
 * admin select existing ones to attach to a gallery (product- or variant-level),
 * instead of re-uploading. Paginated via "Load more".
 *
 * Also exposes an "Upload from device" button (via onUpload prop) so the admin
 * never needs a separate tile — one button opens this combined panel.
 */
export default function GalleryPicker({
  open,
  onClose,
  onSelect,
  existing = [],
  onUpload,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: GItem[]) => void;
  /** paths already on the gallery — shown as "added" and not selectable */
  existing?: string[];
  /** optional: called with a FileList when the user picks files to upload */
  onUpload?: (files: FileList | null) => void;
  /** reflects the parent's uploading state so the upload button can show a spinner */
  busy?: boolean;
}) {
  const { images, loading, error, hasMore, load } = useGallery("", 30);
  const [selected, setSelected] = useState<Record<string, GalleryItem>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const added = new Set(existing);

  async function deleteImage(img: GalleryItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${img.originalFileName || img.path}"?`)) return;

    setDeleting(img.id);
    try {
      const res = await fetch(`/api/admin/gallery?id=${img.id}&storageKey=${encodeURIComponent(img.path)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      // Reload gallery after deletion
      load(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

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
    onSelect(
      chosen.map((i) => ({
        path:       i.path,
        url:        i.fullUrl  || i.url,
        thumbUrl:   i.thumbUrl || i.url,
        mediumUrl:  i.mediumUrl || i.url,
        fullUrl:    i.fullUrl  || i.url,
        blurDataURL: i.blurDataURL || "",
      })),
    );
    close();
  };

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" onClick={close}>
      <div className="adm-modal__panel" onClick={(e) => e.stopPropagation()}>

        {/* ── header ── */}
        <div className="adm-modal__head">
          <div>
            <div className="adm-modal__title">Add images</div>
            <div className="adm-modal__sub">
              {images.length} in library{chosen.length ? ` · ${chosen.length} selected` : ""}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            {/* Upload from device — hidden file input triggered by button */}
            {onUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={busy}
                  onChange={(e) => {
                    onUpload(e.target.files);
                    // reset so same file can be re-chosen if needed
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="adm-btn adm-btn--gold adm-btn--sm"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {busy ? "⏳ Uploading…" : "↑ Upload from device"}
                </button>
              </>
            )}
            <button type="button" className="adm-modal__close" onClick={close} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── body ── */}
        <div className="adm-modal__body">
          {error && <p className="adm-sub" style={{ color: "var(--danger, #b23)" }}>{error}</p>}
          {images.length === 0 && !loading && !error && (
            <p className="adm-sub">No images in storage yet — use "Upload from device" above to add some.</p>
          )}
          <div className="adm-picker-grid">
            {images.map((img) => {
              const isAdded = added.has(img.path);
              const isSel = Boolean(selected[img.path]);
              const isDel = deleting === img.id;
              return (
                <div
                  key={img.name}
                  style={{ position: "relative" }}
                >
                  <button
                    type="button"
                    className={`adm-pick${isSel ? " is-selected" : ""}${isAdded ? " is-added" : ""}`}
                    onClick={() => toggle(img)}
                    title={img.path}
                  >
                    {/* Use thumbUrl (150px) + blur-up for blazing-fast grid loading */}
                    <Image
                      src={img.thumbUrl || img.url}
                      alt=""
                      width={120}
                      height={160}
                      loading="lazy"
                      sizes="120px"
                      placeholder={img.blurDataURL ? "blur" : "empty"}
                      blurDataURL={img.blurDataURL || undefined}
                    />
                    {isAdded && <span className="adm-pick__added">Added</span>}
                    {isSel && <span className="adm-pick__check">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deleteImage(img, e)}
                    disabled={isDel}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "28px",
                      height: "28px",
                      padding: 0,
                      background: "rgba(200,0,0,0.8)",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      cursor: isDel ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isDel ? 0.6 : 1,
                    }}
                    title="Delete image"
                  >
                    {isDel ? "⏳" : "🗑"}
                  </button>
                </div>
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

        {/* ── footer ── */}
        <div className="adm-modal__foot">
          <span className="adm-modal__sub">{chosen.length} selected from library</span>
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
