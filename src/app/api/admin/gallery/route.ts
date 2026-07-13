import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET ?prefix=&limit=&lastDocId=
 *
 * Lists images from the `media_library` table — sorted by most recently
 * uploaded, offset-paginated. `lastDocId` is an opaque token to the client
 * (useGallery just echoes it back); here it is the stringified next offset.
 * Returns full variant URLs, blurDataURL, and image dimensions per image.
 *
 * Falls back gracefully: if `media_library` is empty (first deploy before any
 * uploads), returns an empty array so the UI doesn't break.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const prefix = (searchParams.get("prefix") ?? "").replace(/^\/+/, "");
  const offset = Math.max(0, Number(searchParams.get("lastDocId")) || 0);
  const limit  = Math.min(120, Math.max(1, Number(searchParams.get("limit")) || 60));

  try {
    let query = supabaseAdmin()
      .from("media_library")
      .select("id,data")
      .order("uploaded_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Filter by prefix if provided (e.g. a specific product folder)
    if (prefix) query = query.eq("prefix", prefix);

    const { data: rows, error } = await query;
    if (error) throw error;

    const images = (rows ?? []).map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id:             r.id,
        path:           d.path        ?? "",
        prefix:         d.prefix      ?? "",
        name:           d.path        ?? "",   // kept for GItem compatibility
        url:            d.fullUrl     ?? "",   // primary display URL
        thumbUrl:       d.thumbUrl    ?? "",
        mediumUrl:      d.mediumUrl   ?? "",
        fullUrl:        d.fullUrl     ?? "",
        blurDataURL:    d.blurDataURL ?? "",
        originalWidth:  d.originalWidth  ?? null,
        originalHeight: d.originalHeight ?? null,
        fileSizeBytes:  d.fileSizeBytes  ?? 0,
        contentType:    d.contentType    ?? "",
        originalFileName: d.originalFileName ?? "",
        uploadedAt:     d.uploadedAt  ?? null,
        uploadedBy:     d.uploadedBy  ?? "",
        // legacy compat — size/updated for components that still read them
        size:           d.fileSizeBytes ?? 0,
        updated:        d.uploadedAt ?? null,
      };
    });

    const nextPageToken = (rows?.length ?? 0) === limit ? String(offset + limit) : null;

    return NextResponse.json({ images, nextPageToken });
  } catch (e) {
    console.error("gallery list error", e);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

/**
 * DELETE ?id=<media_library row id>&storageKey=<optional storage path>
 *
 * Removes the metadata row from `media_library`. Optionally also deletes the
 * Storage object if `storageKey` is provided.
 */
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const docId      = searchParams.get("id");
  const storageKey = searchParams.get("storageKey");

  if (!docId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // 1. Delete the media_library row
    const { error } = await supabaseAdmin().from("media_library").delete().eq("id", docId);
    if (error) throw error;

    // 2. Optionally delete the Storage object (best-effort)
    if (storageKey) {
      await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .remove([storageKey])
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("gallery delete error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
