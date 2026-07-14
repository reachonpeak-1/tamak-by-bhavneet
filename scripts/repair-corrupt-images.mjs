// Repair images in the Supabase `media` bucket whose bytes were corrupted in transit.
//
// Background: the app's routes used to upload a Node Buffer as the fetch body. The deployed fetch
// layer doesn't treat a Buffer as binary and coerced it with String(), UTF-8-mangling every
// non-ASCII byte (U+FFFD) and destroying ~2/3 of each file. The routes now upload a Blob instead;
// this script repairs the objects written before that fix.
//
// Recovery works because /api/admin/upload always keeps an untouched `<base>-original.<ext>`.
// For each corrupt object we find that original, regenerate the WebP variants from it, re-upload,
// and repoint media_library + products at the fresh URLs.
//
// Usage: node scripts/repair-corrupt-images.mjs [--apply]
//   (default is a dry run — report only, change nothing)
//
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import ws from "ws";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const BUCKET = "media";

// Same targets as src/app/api/admin/upload/route.ts
const VARIANTS = [
  { width: 1200, quality: 82, suffix: "full" },
  { width: 600,  quality: 80, suffix: "medium" },
  { width: 150,  quality: 75, suffix: "thumb" },
];

const { NEXT_PUBLIC_SUPABASE_URL: URL_, SUPABASE_SECRET_KEY } = process.env;
if (!URL_ || !SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(URL_, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const publicUrl = (key) => `${URL_}/storage/v1/object/public/${BUCKET}/${key}`;
const toRelPath = (key) => (key.startsWith("products/") ? key.slice("products/".length) : key);

/** Recursively list every object key in the bucket. */
async function listAll(prefix = "") {
  const keys = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list ${prefix}: ${error.message}`);
  for (const entry of data ?? []) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Storage returns folders as rows with a null id.
    if (entry.id === null) keys.push(...(await listAll(key)));
    else keys.push(key);
  }
  return keys;
}

async function downloadBuffer(key) {
  const { data, error } = await supabase.storage.from(BUCKET).download(key);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Binary-safe upload — a Blob, never a Buffer (see the note at the top of this file). */
async function uploadImage(key, buf, contentType) {
  const body = new Blob([new Uint8Array(buf)], { type: contentType });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, body, { contentType, cacheControl: "31536000", upsert: true });
  if (error) throw new Error(`upload ${key}: ${error.message}`);
  return publicUrl(key);
}

/** `dir/NAME-1234-rot5678-full.webp` → `dir/NAME-1234` */
function baseOf(key) {
  const dir = key.slice(0, key.lastIndexOf("/"));
  const name = key
    .slice(key.lastIndexOf("/") + 1)
    .replace(/\.[^.]+$/, "")
    .replace(/-(full|medium|thumb|original)$/, "")
    .replace(/-rot\d+$/, "");
  return `${dir}/${name}`;
}

async function main() {
  console.log(APPLY ? "REPAIRING (--apply)\n" : "DRY RUN — nothing will be changed (pass --apply to fix)\n");

  const keys = await listAll();
  const images = keys.filter((k) => /\.(webp|jpe?g|png|avif)$/i.test(k));
  console.log(`Scanning ${images.length} objects…\n`);

  // Validate concurrently — one round-trip per object, and there are ~1400 of them.
  const corrupt = [];
  let scanned = 0;
  const queue = [...images];
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      for (let key = queue.shift(); key; key = queue.shift()) {
        const buf = await downloadBuffer(key);
        if (++scanned % 200 === 0) process.stdout.write(`  …${scanned}/${images.length}\n`);
        if (!buf) continue;
        try {
          await sharp(buf).metadata();
        } catch {
          corrupt.push(key);
          console.log(`  CORRUPT  ${key}  (${buf.length}b)`);
        }
      }
    })
  );

  // A base is broken if any of its objects are corrupt, or if a master exists whose expected
  // variants are missing entirely (e.g. an earlier repair deleted them).
  const present = new Set(keys);
  const masters = keys.filter((k) => /-original\.[^.]+$/.test(k));
  const missing = masters
    .map(baseOf)
    .filter((base) => VARIANTS.some((v) => !present.has(`${base}-${v.suffix}.webp`)));

  const groups = [...new Set([...corrupt.map(baseOf), ...missing])];

  if (!groups.length) {
    console.log("No corrupt or missing variants found. Nothing to repair.");
    return;
  }
  console.log(`\n${corrupt.length} corrupt object(s), ${missing.length} base(s) missing variants.\n`);

  for (const base of groups) {
    // The untouched master kept by the upload route.
    const original = keys.find((k) => new RegExp(`^${base}-original\\.[^.]+$`).test(k));
    if (!original) {
      console.log(`SKIP  ${base} — no -original.* master to rebuild from (unrecoverable here)`);
      continue;
    }

    const srcBuf = await downloadBuffer(original);
    if (!srcBuf) {
      console.log(`SKIP  ${base} — could not download ${original}`);
      continue;
    }
    try {
      await sharp(srcBuf).metadata();
    } catch {
      console.log(`SKIP  ${base} — the master ${original} is itself corrupt`);
      continue;
    }

    console.log(`REPAIR ${base}  ← ${original}`);
    if (!APPLY) continue;

    // The corrupt objects carry the orientation the admin last chose; rebuilding from the master
    // restores the image but not that rotation. Re-rotate in the admin afterwards if needed.
    const pipeline = sharp(srcBuf, { limitInputPixels: 40_000_000, failOn: "error" }).rotate();
    const urls = {};
    for (const v of VARIANTS) {
      const out = await pipeline
        .clone()
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality })
        .toBuffer();
      urls[v.suffix] = await uploadImage(`${base}-${v.suffix}.webp`, out, "image/webp");
    }
    const blurBuf = await pipeline.clone().resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
    const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

    // Verify the round-trip actually stored valid bytes this time.
    const check = await downloadBuffer(`${base}-thumb.webp`);
    await sharp(check).metadata();
    console.log(`       variants rebuilt and verified`);

    const newRelPath = toRelPath(`${base}.webp`);
    const fresh = {
      path: newRelPath,
      url: urls.full,
      thumbUrl: urls.thumb,
      mediumUrl: urls.medium,
      fullUrl: urls.full,
      blurDataURL,
    };

    // Any DB row still pointing at a corrupt -rot* URL for this image.
    const staleUrls = new Set(
      corrupt.filter((k) => baseOf(k) === base).flatMap((k) => [publicUrl(k), publicUrl(k)])
    );
    const staleRel = new Set(corrupt.filter((k) => baseOf(k) === base).map((k) => toRelPath(k)));

    const matches = (g) =>
      (typeof g.url === "string" && staleUrls.has(g.url)) ||
      (typeof g.fullUrl === "string" && staleUrls.has(g.fullUrl)) ||
      (typeof g.thumbUrl === "string" && staleUrls.has(g.thumbUrl)) ||
      (typeof g.mediumUrl === "string" && staleUrls.has(g.mediumUrl)) ||
      (typeof g.path === "string" && (staleRel.has(g.path) || baseOf(`x/${g.path}`) === baseOf(`x/${newRelPath}`)));

    // ── media_library ────────────────────────────────────────────────────────
    const { data: mediaRows } = await supabase.from("media_library").select("id,data");
    for (const row of mediaRows ?? []) {
      if (!matches(row.data ?? {})) continue;
      const { error } = await supabase
        .from("media_library")
        .update({ data: { ...row.data, ...fresh } })
        .eq("id", row.id);
      if (error) throw new Error(`media_library ${row.id}: ${error.message}`);
      console.log(`       media_library ${row.id} repointed`);
    }

    // ── products (gallery + variants[].gallery) ──────────────────────────────
    const { data: productRows } = await supabase.from("products").select("id,data");
    const changed = [];
    for (const row of productRows ?? []) {
      const data = row.data ?? {};
      let hit = false;
      const galleries = [
        data.gallery,
        ...(Array.isArray(data.variants) ? data.variants.map((v) => v.gallery) : []),
      ];
      for (const gallery of galleries) {
        if (!Array.isArray(gallery)) continue;
        for (const g of gallery) {
          if (!matches(g)) continue;
          if (data.imagePath === g.path) {
            data.imagePath = newRelPath;
            data.blurDataURL = blurDataURL;
          }
          Object.assign(g, fresh);
          hit = true;
        }
      }
      if (hit) changed.push({ id: row.id, data });
    }
    if (changed.length) {
      const { error } = await supabase.from("products").upsert(changed, { onConflict: "id" });
      if (error) throw new Error(`products upsert: ${error.message}`);
      console.log(`       ${changed.length} product row(s) repointed`);
    }

    // ── drop the corrupt objects ─────────────────────────────────────────────
    // Never delete a key we just rewrote: when the corruption came from the upload route (rather
    // than rotate) the corrupt keys ARE the canonical `<base>-<suffix>.webp` keys, so the fresh
    // variants live at those same names.
    const rewritten = new Set(VARIANTS.map((v) => `${base}-${v.suffix}.webp`));
    const dead = corrupt.filter((k) => baseOf(k) === base && !rewritten.has(k));
    if (dead.length) {
      await supabase.storage.from(BUCKET).remove(dead);
      console.log(`       removed ${dead.length} stale corrupt object(s)`);
    }
  }

  console.log(APPLY ? "\nDone." : "\nDry run complete — re-run with --apply to repair.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
