import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin, STORAGE_BUCKET, publicStorageUrl } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { bumpProducts } from "@/lib/revalidate";

export const runtime = "nodejs";

// Same optimisation targets as /api/admin/upload.
const VARIANTS = [
  { width: 1200, quality: 82, suffix: "full" },
  { width: 600,  quality: 80, suffix: "medium" },
  { width: 150,  quality: 75, suffix: "thumb" },
] as const;

const PUBLIC_PREFIX = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

/** Storage key from a public URL of our bucket, else null. */
function keyFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.pathname.startsWith(PUBLIC_PREFIX)) return null;
    return decodeURIComponent(u.pathname.slice(PUBLIC_PREFIX.length));
  } catch {
    return null;
  }
}

/** products/<rel> keys are stored as <rel> in product docs; content/ keys as-is. */
const toRelPath = (key: string) => (key.startsWith("products/") ? key.slice("products/".length) : key);

/** Reject traversal: a safe relative path has no empty/"."/".." segments. */
const isSafePath = (p: string) => p.split("/").every((seg) => seg && seg !== "." && seg !== "..");

async function download(key: string): Promise<Buffer | null> {
  // Public bucket → fetch via the CDN-backed public URL (the authenticated
  // storage endpoint always hits origin and is several times slower).
  try {
    const res = await fetch(publicStorageUrl(key));
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch {}
  const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).download(key);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

interface RotateBody {
  direction?: "cw" | "ccw";
  path?: string;     // entry path, e.g. "PROD_1/1.jpg" or "content/hero/x.webp"
  url?: string;      // entry primary/master URL (absolute)
  fullUrl?: string;  // entry full-variant URL (absolute)
  id?: string;       // media_library row id, when rotating from the Media page
}

// POST → physically rotate an image 90° and update every reference to it
// (media_library row + all product galleries). New object names are minted so
// the year-long CDN/browser caches can never show the stale orientation.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let b: RotateBody;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const angle = b.direction === "ccw" ? -90 : 90;
  const sb = supabaseAdmin();

  // Old identifiers used to find every reference.
  const oldPath = b.path ?? null;
  const oldUrls = new Set([b.url, b.fullUrl].filter(Boolean) as string[]);

  // ── Reference lookups depend only on the OLD identifiers, so they run
  //    concurrently with the download/encode/upload work below. ─────────────
  const containments: Record<string, unknown>[] = [];
  if (oldPath) {
    containments.push({ gallery: [{ path: oldPath }] });
    containments.push({ variants: [{ gallery: [{ path: oldPath }] }] });
  }
  for (const u of oldUrls) {
    containments.push({ gallery: [{ url: u }] }, { gallery: [{ fullUrl: u }] });
    containments.push({ variants: [{ gallery: [{ url: u }] }] });
  }
  const productRefsPromise = Promise.all(
    containments.map((c) => sb.from("products").select("id,data").contains("data", c))
  );
  const mediaRefsPromise = b.id
    ? sb.from("media_library").select("id,data").eq("id", b.id)
    : sb.from("media_library").select("id,data").eq("data->>path", oldPath ?? "");

  // ── Resolve the best available source image ──────────────────────────────
  // Prefer the 1200px full variant (exists for both admin uploads and
  // backfilled seed images); fall back to the raw master.
  const candidates: string[] = [];
  const fullKey = keyFromUrl(b.fullUrl);
  if (fullKey && isSafePath(fullKey)) candidates.push(fullKey);
  const urlKey = keyFromUrl(b.url);
  if (urlKey && isSafePath(urlKey)) candidates.push(urlKey);
  if (b.path && isSafePath(b.path)) candidates.push(b.path.startsWith("content/") ? b.path : `products/${b.path}`);

  let srcBuf: Buffer | null = null;
  let srcKey: string | null = null;
  for (const key of candidates) {
    srcBuf = await download(key);
    if (srcBuf) { srcKey = key; break; }
  }
  if (!srcBuf || !srcKey) {
    return NextResponse.json({ error: "Image file not found in storage" }, { status: 404 });
  }

  try {
    // ── New base name (strip old -rot<ts> / -full suffixes so names don't grow)
    const dir = srcKey.slice(0, srcKey.lastIndexOf("/"));
    let name = srcKey.slice(srcKey.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
    name = name.replace(/-(full|medium|thumb|original)$/, "").replace(/-rot\d+$/, "");
    const newBase = `${dir}/${name}-rot${Date.now()}`;

    // ── Rotate once, then emit the three WebP variants + blur (in parallel) ─
    const rotated = sharp(srcBuf, { limitInputPixels: 40_000_000, failOn: "error" }).rotate(angle);
    const urls: Record<string, string> = {};
    const [blurBuf] = await Promise.all([
      rotated.clone().resize({ width: 16 }).webp({ quality: 30 }).toBuffer(),
      ...VARIANTS.map(async (v) => {
        const out = await rotated
          .clone()
          .resize({ width: v.width, withoutEnlargement: true })
          .webp({ quality: v.quality })
          .toBuffer();
        const key = `${newBase}-${v.suffix}.webp`;
        const { error } = await supabaseAdmin()
          .storage.from(STORAGE_BUCKET)
          .upload(key, out, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
        if (error) throw new Error(error.message);
        urls[v.suffix] = publicStorageUrl(key);
      }),
    ]);
    const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    const newRelPath = toRelPath(`${newBase}.webp`);
    const fresh = {
      path: newRelPath,
      url: urls.full,
      thumbUrl: urls.thumb,
      mediumUrl: urls.medium,
      fullUrl: urls.full,
      blurDataURL,
    };

    // ── 1. media_library rows (lookup already ran during download/encode) ───
    const updateMedia = (async () => {
      const { data: mediaRows } = await mediaRefsPromise;
      await Promise.all(
        (mediaRows ?? []).map(async (row) => {
          const d = row.data as Record<string, unknown>;
          const { error } = await sb
            .from("media_library")
            .update({
              data: {
                ...d,
                path: newRelPath,
                thumbUrl: urls.thumb,
                mediumUrl: urls.medium,
                fullUrl: urls.full,
                blurDataURL,
              },
            })
            .eq("id", row.id);
          if (error) throw new Error(error.message);
        })
      );
    })();

    // ── 2. products referencing this image (lookup already ran in parallel) ─
    const results = await productRefsPromise;
    const byId = new Map<string, Record<string, unknown>>();
    for (const r of results) {
      if (r.error) throw new Error(r.error.message);
      for (const row of r.data ?? []) byId.set(row.id, row.data as Record<string, unknown>);
    }

    const matches = (g: Record<string, unknown>) =>
      (oldPath && g.path === oldPath) ||
      (typeof g.url === "string" && oldUrls.has(g.url)) ||
      (typeof g.fullUrl === "string" && oldUrls.has(g.fullUrl as string));

    const changed: { id: string; data: Record<string, unknown> }[] = [];
    for (const [id, data] of byId) {
      let hit = false;
      const galleries = [
        data.gallery,
        ...(Array.isArray(data.variants)
          ? (data.variants as Record<string, unknown>[]).map((v) => v.gallery)
          : []),
      ];
      for (const gallery of galleries) {
        if (!Array.isArray(gallery)) continue;
        for (const g of gallery as Record<string, unknown>[]) {
          if (!matches(g)) continue;
          if (data.imagePath === g.path) {
            data.imagePath = newRelPath;
            data.blurDataURL = blurDataURL;
          }
          Object.assign(g, fresh);
          hit = true;
        }
      }
      if (hit) changed.push({ id, data });
    }
    const updateProducts = (async () => {
      if (!changed.length) return;
      const { error } = await sb.from("products").upsert(changed, { onConflict: "id" });
      if (error) throw new Error(error.message);
      bumpProducts();
    })();

    // ── 3. best-effort cleanup of the old variant objects ────────────────────
    const oldVariantKeys = [...oldUrls]
      .map((u) => keyFromUrl(u))
      .filter((k): k is string => Boolean(k))
      .flatMap((k) => {
        const base = k.replace(/-(full|medium|thumb)\.webp$/, "");
        return base === k ? [] : [`${base}-full.webp`, `${base}-medium.webp`, `${base}-thumb.webp`];
      });
    const cleanup = oldVariantKeys.length
      ? sb.storage.from(STORAGE_BUCKET).remove([...new Set(oldVariantKeys)]).catch(() => {})
      : Promise.resolve();

    const audit = logAudit({
      actor: admin.email ?? admin.uid,
      action: "media.rotate",
      target: { collection: "media_library", id: b.id ?? oldPath ?? srcKey },
      after: { direction: b.direction ?? "cw", newPath: newRelPath, productsUpdated: changed.length },
    });

    await Promise.all([updateMedia, updateProducts, cleanup, audit]);

    return NextResponse.json({ ok: true, ...fresh, productsUpdated: changed.length });
  } catch (e) {
    console.error("rotate error", e);
    return NextResponse.json({ error: "Rotate failed" }, { status: 500 });
  }
}
