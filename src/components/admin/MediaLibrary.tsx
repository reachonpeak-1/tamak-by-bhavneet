"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useGallery } from "@/components/admin/useGallery";
import { useStore } from "@/components/StoreProvider";

/**
 * Browser for every product image in Supabase Storage, paginated via
 * "Load more". Reuses the same useGallery reader as the in-editor picker.
 * Allows admins to delete images from the library.
 */
export default function MediaLibrary() {
  const { getToken } = useAuth();
  const { images, loading, error, hasMore, load, patch } = useGallery("", 30);
  const { toast } = useStore();
  const [deleting, setDeleting] = useState<string | null>(null);
  // Optimistic rotation: quarter-turns shown via CSS while the server rotates
  // the real file in the background. Cleared when the rotated URLs arrive.
  const [turns, setTurns] = useState<Record<string, number>>({});
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast("URL copied");
    } catch {
      toast("Copy failed");
    }
  };

  const rotate = async (img: { id: string; path: string; url: string; fullUrl: string }, direction: "cw" | "ccw") => {
    if (inFlight[img.id]) return; // one request per image at a time
    const delta = direction === "cw" ? 1 : -1;
    // Instant visual feedback — the card turns immediately.
    setTurns((t) => ({ ...t, [img.id]: (t[img.id] ?? 0) + delta }));
    setInFlight((f) => ({ ...f, [img.id]: true }));
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/media/rotate", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ id: img.id, path: img.path, url: img.url, fullUrl: img.fullUrl, direction }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Rotate failed");
      // Swap in the real rotated file and clear the CSS turn in one paint.
      patch(img.id, {
        path: j.path,
        url: j.url,
        thumbUrl: j.thumbUrl,
        mediumUrl: j.mediumUrl,
        fullUrl: j.fullUrl,
        blurDataURL: j.blurDataURL,
      });
      setTurns((t) => ({ ...t, [img.id]: (t[img.id] ?? 0) - delta }));
    } catch (e) {
      // Revert the optimistic turn.
      setTurns((t) => ({ ...t, [img.id]: (t[img.id] ?? 0) - delta }));
      toast("Rotate failed: " + (e as Error).message);
    } finally {
      setInFlight((f) => ({ ...f, [img.id]: false }));
    }
  };

  const deleteImage = async (id: string, path: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?\n\nThis cannot be undone.`)) return;

    setDeleting(id);
    try {
      const token = await getToken();
      const url = `/api/admin/gallery?id=${id}&storageKey=${encodeURIComponent(path)}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Delete failed");
      }

      toast("Image deleted");
      load(true);
    } catch (e) {
      toast("Delete failed: " + (e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="adm-card">
      {error && <p className="adm-sub" style={{ color: "var(--danger, #b23)" }}>{error}</p>}
      {images.length === 0 && !loading && !error && (
        <p className="adm-sub">No images uploaded to storage yet.</p>
      )}

      <div className="adm-picker-grid">
        {images.map((img) => {
          const isDel = deleting === img.id;
          const isRot = Boolean(inFlight[img.id]);
          const turn = turns[img.id] ?? 0;
          return (
            <div key={img.id} style={{ position: "relative" }} title={img.path}>
              <div className="adm-pick" style={{ cursor: "default", overflow: "hidden" }}>
                <Image
                  src={img.thumbUrl || img.url}
                  alt=""
                  width={120}
                  height={160}
                  loading="lazy"
                  sizes="120px"
                  placeholder={img.blurDataURL ? "blur" : "empty"}
                  blurDataURL={img.blurDataURL || undefined}
                  style={{
                    objectFit: "cover",
                    transform: `rotate(${turn * 90}deg)${turn % 2 !== 0 ? " scale(1.34)" : ""}`,
                    transition: "transform .25s ease",
                  }}
                />
                <span className="adm-pick__url">
                  <a href={img.url} target="_blank" rel="noopener noreferrer">Open</a>
                  <button type="button" onClick={() => copy(img.url)}>Copy</button>
                </span>
              </div>
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  left: "4px",
                  display: "flex",
                  gap: "4px",
                  zIndex: 10,
                }}
              >
                {(["ccw", "cw"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => rotate(img, dir)}
                    disabled={isRot || isDel}
                    title={dir === "ccw" ? "Rotate left" : "Rotate right"}
                    style={{
                      width: "28px",
                      height: "28px",
                      padding: 0,
                      background: "rgba(0,0,0,0.55)",
                      border: "none",
                      borderRadius: "4px",
                      color: "white",
                      cursor: isRot ? "wait" : "pointer",
                      fontSize: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isRot ? 0.6 : 1,
                    }}
                  >
                    {dir === "ccw" ? "↺" : "↻"}
                  </button>
                ))}
              </span>
              <button
                type="button"
                onClick={() => deleteImage(img.id, img.path, img.originalFileName || img.path)}
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
                  zIndex: 10,
                }}
                title="Delete image"
              >
                {isDel ? "⏳" : "🗑"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
        {hasMore ? (
          <button type="button" className="adm-btn adm-btn--ghost" disabled={loading} onClick={() => load(false)}>
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          images.length > 0 && <span className="adm-sub">{images.length} images · end of library</span>
        )}
      </div>
    </div>
  );
}
