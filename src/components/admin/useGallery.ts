"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export interface GalleryItem {
  /** path relative to the products/ root — ready to store on a product gallery */
  path: string;
  /** full storage object key, e.g. "products/PROD_1/1.jpg" */
  name: string;
  /** public delivery URL */
  url: string;
  size: number;
  updated: string | null;
}

/**
 * Cursor-paginated reader for GET /api/admin/gallery. Shared by the in-editor
 * picker and the standalone media library. Keeps the page cursor in a ref so
 * `load` has a stable identity (safe to call from effects without re-loops).
 */
export function useGallery(prefix = "", limit = 60) {
  const { getToken } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const cursor = useRef<string | null>(null);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (reset) cursor.current = null;
        const params = new URLSearchParams({ prefix, limit: String(limit) });
        if (cursor.current) params.set("pageToken", cursor.current);
        const res = await fetch(`/api/admin/gallery?${params.toString()}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Failed to load images");
        cursor.current = j.nextPageToken ?? null;
        setHasMore(Boolean(j.nextPageToken));
        setImages((prev) => (reset ? j.images : [...prev, ...j.images]));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [getToken, prefix, limit],
  );

  return { images, loading, error, hasMore, load };
}
