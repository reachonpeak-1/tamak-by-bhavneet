import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminStorage, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "_");

// Optimisation targets — width (px), quality, suffix
const VARIANTS = [
  { width: 1200, quality: 82, suffix: "full" },
  { width: 600,  quality: 80, suffix: "medium" },
  { width: 150,  quality: 75, suffix: "thumb" },
] as const;

const CACHE_META = { cacheControl: "public, max-age=31536000, immutable" };

/**
 * Upload a buffer to Firebase Storage and return its public URL.
 */
async function uploadToStorage(
  key: string,
  buf: Buffer,
  contentType: string,
) {
  await adminStorage()
    .bucket()
    .file(key)
    .save(buf, { contentType, metadata: CACHE_META });
  return `https://storage.googleapis.com/${BUCKET}/${key}`;
}

// POST multipart { file, prefix } → uploads to Storage at <root>/<prefix>/<name>
// and returns { path, url, thumbUrl, mediumUrl, fullUrl, blurDataURL }.
// `path` is relative to the "products" root for product galleries (so it matches
// existing data) or "content/<section>".
// Bucket must be public-read (one-time IAM allUsers:objectViewer grant).
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!BUCKET) return NextResponse.json({ error: "Storage bucket not configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "").replace(/^\/+|\/+$/g, "");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Images only" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
  if (!prefix) return NextResponse.json({ error: "Missing prefix" }, { status: 400 });

  // unique-ish name without Math.random/Date in module scope concerns — fine here
  const baseName = `${safe(file.name.replace(/\.[^.]+$/, "")).slice(0, 40)}-${Date.now()}`;
  // product galleries live under products/<id>/...; content under content/<section>/...
  const isContent = prefix.startsWith("content/");
  const dirKey = isContent ? prefix : `products/${prefix}`;
  // relPath is what gets stored in the Firestore doc (without the "products/" prefix
  // for product images, so it can be re-resolved at read time)
  const relPath = isContent ? `${prefix}/${baseName}.webp` : `${prefix}/${baseName}.webp`;

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ── 1. Read original image dimensions (before any resizing) ───────────
    const imgMeta = await sharp(rawBuffer).metadata();
    const originalWidth  = imgMeta.width  ?? null;
    const originalHeight = imgMeta.height ?? null;

    // ── 2. Upload original as backup ──────────────────────────────────────
    const origExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const originalStorageKey = `${dirKey}/${baseName}-original.${origExt}`;
    await uploadToStorage(originalStorageKey, rawBuffer, file.type);

    // ── 3. Generate optimised WebP variants via Sharp ─────────────────────
    const pipeline = sharp(rawBuffer).rotate(); // auto-rotate from EXIF
    const urls: Record<string, string> = {};

    for (const v of VARIANTS) {
      const buf = await pipeline
        .clone()
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality })
        .toBuffer();
      const key = `${dirKey}/${baseName}-${v.suffix}.webp`;
      urls[v.suffix] = await uploadToStorage(key, buf, "image/webp");
    }

    // ── 4. Generate blurDataURL (tiny 16px base64 placeholder) ────────────
    const blurBuf = await pipeline
      .clone()
      .resize({ width: 16 })
      .webp({ quality: 30 })
      .toBuffer();
    const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    // ── 5. Auto-save full metadata to Firestore mediaLibrary ──────────────
    // Runs on every upload — no manual product save required.
    // Gallery Picker reads from this collection instead of listing Storage
    // (Firestore queries are ~10x faster than Storage getFiles()).
    await adminDb().collection("mediaLibrary").add({
      // paths & variant URLs
      path:              relPath,
      prefix,
      originalStorageKey,
      thumbUrl:          urls.thumb,
      mediumUrl:         urls.medium,
      fullUrl:           urls.full,
      blurDataURL,
      // image intrinsics
      originalWidth,
      originalHeight,
      fileSizeBytes:     file.size,
      contentType:       file.type,
      originalFileName:  file.name,
      // audit
      uploadedAt:        FieldValue.serverTimestamp(),
      uploadedBy:        admin.uid,
    });

    return NextResponse.json({
      path: relPath,
      url: urls.full,         // primary URL → the full 1200px version
      thumbUrl:   urls.thumb,
      mediumUrl:  urls.medium,
      fullUrl:    urls.full,
      blurDataURL,
      originalWidth,
      originalHeight,
    });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
