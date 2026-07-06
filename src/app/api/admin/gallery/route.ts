import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb, adminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/**
 * GET ?prefix=&limit=&lastDocId=
 *
 * Lists images from the Firestore `mediaLibrary` collection — sorted by most
 * recently uploaded, cursor-paginated via `lastDocId`. This is ~10x faster
 * than listing Firebase Storage objects and returns full variant URLs,
 * blurDataURL, and image dimensions for each image.
 *
 * Falls back gracefully: if `mediaLibrary` is empty (first deploy before any
 * uploads), returns an empty array so the UI doesn't break.
 */
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const prefix      = (searchParams.get("prefix") ?? "").replace(/^\/+/, "");
  const lastDocId   = searchParams.get("lastDocId") ?? null;
  const limit       = Math.min(120, Math.max(1, Number(searchParams.get("limit")) || 60));

  try {
    const db = adminDb();
    let query = db
      .collection("mediaLibrary")
      .orderBy("uploadedAt", "desc")
      .limit(limit);

    // Filter by prefix if provided (e.g. a specific product folder)
    if (prefix) {
      query = query.where("prefix", "==", prefix) as typeof query;
    }

    // Cursor pagination: jump past the last doc from the previous page
    if (lastDocId) {
      const lastSnap = await db.collection("mediaLibrary").doc(lastDocId).get();
      if (lastSnap.exists) {
        query = query.startAfter(lastSnap) as typeof query;
      }
    }

    const snap = await query.get();

    const images = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id:             doc.id,
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
        updated:        d.uploadedAt?.toDate?.()?.toISOString?.() ?? null,
      };
    });

    const lastDoc = snap.docs[snap.docs.length - 1];
    const nextPageToken = snap.docs.length === limit ? (lastDoc?.id ?? null) : null;

    return NextResponse.json({ images, nextPageToken });
  } catch (e) {
    console.error("gallery list error", e);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

/**
 * DELETE ?id=<mediaLibrary doc id>&storageKey=<optional storage path>
 *
 * Removes the Firestore metadata doc from `mediaLibrary`. Optionally also
 * deletes the Storage file if `storageKey` is provided.
 */
export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!BUCKET)  return NextResponse.json({ error: "Storage bucket not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const docId      = searchParams.get("id");
  const storageKey = searchParams.get("storageKey");

  if (!docId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    // 1. Delete the Firestore mediaLibrary document
    await adminDb().collection("mediaLibrary").doc(docId).delete();

    // 2. Optionally delete Storage file (if caller passes storageKey)
    if (storageKey) {
      try {
        await adminStorage().bucket().file(storageKey).delete();
      } catch {
        // Storage delete is best-effort — don't fail the whole request
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("gallery delete error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
