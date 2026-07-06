"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useGallery } from "@/components/admin/useGallery";
import { useStore } from "@/components/StoreProvider";

/**
 * Read-only browser for every product image in Firebase Storage, paginated via
 * "Load more". Reuses the same useGallery reader as the in-editor picker.
 */
export default function MediaLibrary() {
  const { images, loading, error, hasMore, load } = useGallery("", 30);
  const { toast } = useStore();

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

  return (
    <div className="adm-card">
      {error && <p className="adm-sub" style={{ color: "var(--danger, #b23)" }}>{error}</p>}
      {images.length === 0 && !loading && !error && (
        <p className="adm-sub">No images uploaded to storage yet.</p>
      )}

      <div className="adm-picker-grid">
        {images.map((img) => (
          <div className="adm-pick" key={img.name} style={{ cursor: "default" }} title={img.path}>
            <Image
              src={img.thumbUrl || img.url}
              alt=""
              width={120}
              height={160}
              loading="lazy"
              sizes="120px"
              placeholder={img.blurDataURL ? "blur" : "empty"}
              blurDataURL={img.blurDataURL || undefined}
              style={{ objectFit: "cover" }}
            />
            <span className="adm-pick__url">
              <a href={img.url} target="_blank" rel="noopener noreferrer">Open</a>
              <button type="button" onClick={() => copy(img.url)}>Copy</button>
            </span>
          </div>
        ))}
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
