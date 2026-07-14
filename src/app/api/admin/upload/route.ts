import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { uploadImage, assertStoredImageValid } from "@/lib/supabase/storage";

export const runtime = "nodejs";

const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "_");

// Optimisation targets — width (px), quality, suffix
const VARIANTS = [
  { width: 1200, quality: 82, suffix: "full" },
  { width: 600,  quality: 80, suffix: "medium" },
  { width: 150,  quality: 75, suffix: "thumb" },
] as const;

// POST multipart { file, prefix } → uploads to Storage at <root>/<prefix>/<name>
// and returns { path, url, thumbUrl, mediumUrl, fullUrl, blurDataURL }.
// `path` is relative to the "products" root for product galleries (so it matches
// existing data) or "content/<section>".
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }
  const file = form.get("file");
  // Sanitize each path segment: strip unsafe chars and drop any "" / "." / ".."
  // so a crafted prefix can't traverse to other folders in the bucket.
  const rawPrefix = String(form.get("prefix") ?? "");
  const prefix = rawPrefix
    .split("/")
    .map((seg) => safe(seg))
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Images only" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
  if (!prefix) return NextResponse.json({ error: "Missing prefix" }, { status: 400 });

  // unique-ish name without Math.random/Date in module scope concerns — fine here
  const baseName = `${safe(file.name.replace(/\.[^.]+$/, "")).slice(0, 40)}-${Date.now()}`;
  // product galleries live under products/<id>/...; content under content/<section>/...
  const isContent = prefix.startsWith("content/");
  const dirKey = isContent ? prefix : `products/${prefix}`;
  // relPath is what gets stored in the product doc (without the "products/" prefix
  // for product images, so it can be re-resolved at read time)
  const relPath = isContent ? `${prefix}/${baseName}.webp` : `${prefix}/${baseName}.webp`;

  try {
    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ── 1. Decode + validate the image (bounded to guard against decompression
    //       bombs; verify it is actually a raster image, not a spoofed MIME) ──
    const imgMeta = await sharp(rawBuffer, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
    if (!imgMeta.format || !imgMeta.width || !imgMeta.height) {
      return NextResponse.json({ error: "Unsupported or corrupt image" }, { status: 400 });
    }
    const originalWidth  = imgMeta.width;
    const originalHeight = imgMeta.height;
    // Trust sharp's detected format, not the client-supplied Content-Type.
    const detectedType = `image/${imgMeta.format}`;

    // ── 2. Upload original as backup ──────────────────────────────────────
    const origExt = imgMeta.format;
    const originalStorageKey = `${dirKey}/${baseName}-original.${origExt}`;
    await uploadImage(originalStorageKey, rawBuffer, detectedType);

    // ── 3. Generate optimised WebP variants via Sharp ─────────────────────
    const pipeline = sharp(rawBuffer, { limitInputPixels: 40_000_000, failOn: "error" }).rotate();
    const urls: Record<string, string> = {};

    for (const v of VARIANTS) {
      const buf = await pipeline
        .clone()
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality })
        .toBuffer();
      const key = `${dirKey}/${baseName}-${v.suffix}.webp`;
      urls[v.suffix] = await uploadImage(key, buf, "image/webp");
    }

    // Prove the stored bytes survived the round-trip rather than trusting the 200 OK.
    await assertStoredImageValid(`${dirKey}/${baseName}-thumb.webp`);

    // ── 4. Generate blurDataURL (tiny 16px base64 placeholder) ────────────
    const blurBuf = await pipeline
      .clone()
      .resize({ width: 16 })
      .webp({ quality: 30 })
      .toBuffer();
    const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    // ── 5. Auto-save full metadata to media_library ────────────────────────
    // Runs on every upload — no manual product save required.
    // Gallery Picker reads from this table instead of listing Storage objects.
    const { error: metaErr } = await supabaseAdmin().from("media_library").insert({
      data: {
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
        contentType:       detectedType,
        originalFileName:  file.name,
        // audit
        uploadedAt:        new Date().toISOString(),
        uploadedBy:        admin.uid,
      },
    });
    if (metaErr) console.error("media_library insert failed:", metaErr.message);

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
