// Report (and optionally download) images in the Supabase `media` bucket that are not used by any
// product. Read-only against Supabase — this script never deletes or modifies anything.
//
// "Used" means referenced from a product row: gallery[] / variants[].gallery[] (path, url, fullUrl,
// mediumUrl, thumbUrl) or the top-level imagePath. Images used only by site content (category cards,
// hero slides) are still reported — they are not attached to a product — but tagged IN-USE-BY-SITE
// so they aren't mistaken for junk.
//
// Usage:
//   node scripts/unused-images.mjs                  report only, writes nothing
//   node scripts/unused-images.mjs --download       also download each image's original master
//   node scripts/unused-images.mjs --download --out=/some/dir
//
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { mkdirSync, writeFileSync, existsSync, statSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

config({ path: ".env.local" });

const DOWNLOAD = process.argv.includes("--download");
const OUT_DIR =
  process.argv.find((a) => a.startsWith("--out="))?.slice("--out=".length) ??
  join(homedir(), "Downloads", "tamak-unused-images");
const BUCKET = "media";

const { NEXT_PUBLIC_SUPABASE_URL: URL_, SUPABASE_SECRET_KEY } = process.env;
if (!URL_ || !SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(URL_, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

/** Public URL → storage key, or null if it isn't one of ours. */
function keyFromUrl(url) {
  if (typeof url !== "string") return null;
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith(PUBLIC_PREFIX) ? decodeURIComponent(pathname.slice(PUBLIC_PREFIX.length)) : null;
  } catch {
    return null;
  }
}

/** Collapse an object key to the image it belongs to: strip variant/rotation suffix and extension. */
function baseOf(key) {
  const dir = key.slice(0, key.lastIndexOf("/"));
  const name = key
    .slice(key.lastIndexOf("/") + 1)
    .replace(/\.[^.]+$/, "")
    .replace(/-(full|medium|thumb|original)$/, "")
    .replace(/-rot\d+$/, "");
  return `${dir}/${name}`;
}

/** A DB-stored path: product paths omit the "products/" prefix, content paths are absolute keys. */
const baseOfStoredPath = (p) => baseOf(p.startsWith("content/") || p.startsWith("uploads/") ? p : `products/${p}`);

/** Recursively list every object key in the bucket (folders come back with a null id). */
async function listAll(prefix = "") {
  const keys = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list ${prefix}: ${error.message}`);
  for (const entry of data ?? []) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) keys.push(...(await listAll(key)));
    else keys.push({ key, bytes: entry.metadata?.size ?? 0 });
  }
  return keys;
}

/** PostgREST caps a response at 1000 rows — page through the whole table or references get missed. */
async function selectAll(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select("id,data").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) return rows;
  }
}

/** Every image base referenced by a product gallery. */
function productRefs(products) {
  const used = new Set();
  const add = (b) => b && used.add(b);
  for (const row of products) {
    const d = row.data ?? {};
    const galleries = [d.gallery, ...(Array.isArray(d.variants) ? d.variants.map((v) => v.gallery) : [])];
    for (const gallery of galleries) {
      if (!Array.isArray(gallery)) continue;
      for (const img of gallery) {
        if (typeof img?.path === "string") add(baseOfStoredPath(img.path));
        for (const field of ["url", "fullUrl", "mediumUrl", "thumbUrl"]) {
          const key = keyFromUrl(img?.[field]);
          if (key) add(baseOf(key));
        }
      }
    }
    if (typeof d.imagePath === "string") add(baseOfStoredPath(d.imagePath));
  }
  return used;
}

/** Image bases referenced by site content (category cards, hero slides) — for labelling only. */
function siteRefs(categories, content) {
  const used = new Set();
  const walk = (node) => {
    if (!node) return;
    if (typeof node === "string") {
      const key = keyFromUrl(node);
      if (key) used.add(baseOf(key));
      return;
    }
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === "object") return Object.values(node).forEach(walk);
  };
  for (const row of [...categories, ...content]) walk(row.data);
  return used;
}

/** The best single file to keep for an image: the untouched master, else the largest variant. */
function masterOf(files) {
  const keys = files.map((f) => f.key);
  return (
    keys.find((k) => /-original\.[^.]+$/.test(k)) ??
    keys.find((k) => !/-(full|medium|thumb)\.webp$/.test(k)) ??
    keys.find((k) => /-full\.webp$/.test(k)) ??
    keys[0]
  );
}

async function downloadTo(key, dest) {
  const { data, error } = await supabase.storage.from(BUCKET).download(key);
  if (error || !data) throw new Error(`download ${key}: ${error?.message ?? "no data"}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await data.arrayBuffer()));
}

async function main() {
  const objects = (await listAll()).filter((o) => /\.(webp|jpe?g|png|avif)$/i.test(o.key));
  const [products, categories, content] = await Promise.all([
    selectAll("products"),
    selectAll("categories"),
    selectAll("content"),
  ]);
  const media = await selectAll("media_library");

  const used = productRefs(products);
  const onSite = siteRefs(categories, content);
  const inLibrary = new Set(
    media.map((r) => r.data?.path).filter((p) => typeof p === "string").map(baseOfStoredPath)
  );

  // Group objects into the images they belong to.
  const byBase = new Map();
  for (const obj of objects) {
    const b = baseOf(obj.key);
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b).push(obj);
  }

  const unused = [...byBase.keys()].filter((b) => !used.has(b)).sort();
  const folderOf = (b) => (b.startsWith("uploads/") ? "uploads" : b.startsWith("content/") ? "content" : "products");

  console.log(`\nStorage: ${objects.length} objects → ${byBase.size} distinct images`);
  console.log(`Used by a product:   ${used.size}`);
  console.log(`NOT used by a product: ${unused.length}\n`);

  for (const folder of ["uploads", "products", "content"]) {
    const group = unused.filter((b) => folderOf(b) === folder);
    if (!group.length) continue;
    const bytes = group.reduce((n, b) => n + byBase.get(b).reduce((m, o) => m + o.bytes, 0), 0);
    const live = group.filter((b) => onSite.has(b)).length;
    console.log(
      `${folder.padEnd(9)} ${String(group.length).padStart(4)} images  ` +
        `(${(bytes / 1024 / 1024).toFixed(1)} MB)` +
        (live ? `  ⚠ ${live} still IN USE by site content (category/hero) — not junk` : "")
    );
  }

  console.log("\n--- unused images ---");
  for (const base of unused) {
    const tags = [
      onSite.has(base) ? "IN-USE-BY-SITE" : null,
      inLibrary.has(base) ? "in-gallery-picker" : null,
    ].filter(Boolean);
    console.log(`  ${base}${tags.length ? `   [${tags.join(", ")}]` : ""}`);
  }

  // Manifest — always written next to the downloads so the list is reviewable outside the terminal.
  mkdirSync(OUT_DIR, { recursive: true });
  const csv = [
    "base,folder,master_file,file_count,bytes,in_media_library,in_use_by_site",
    ...unused.map((b) => {
      const files = byBase.get(b);
      const bytes = files.reduce((m, o) => m + o.bytes, 0);
      return [
        `"${b}"`,
        folderOf(b),
        `"${masterOf(files)}"`,
        files.length,
        bytes,
        inLibrary.has(b),
        onSite.has(b),
      ].join(",");
    }),
  ].join("\n");
  const manifest = join(OUT_DIR, "unused-images.csv");
  writeFileSync(manifest, csv);
  console.log(`\nManifest: ${manifest}`);

  if (!DOWNLOAD) {
    console.log("Report only — nothing downloaded. Re-run with --download to fetch the originals.");
    return;
  }

  // ── download each image's original master ────────────────────────────────────
  console.log(`\nDownloading ${unused.length} originals → ${OUT_DIR}\n`);
  const queue = unused.map((b) => ({ base: b, key: masterOf(byBase.get(b)) }));
  let done = 0;
  let skipped = 0;
  let failed = 0;

  await Promise.all(
    Array.from({ length: 12 }, async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const dest = join(OUT_DIR, item.key);
        if (existsSync(dest) && statSync(dest).size > 0) {
          skipped++;
        } else {
          try {
            await downloadTo(item.key, dest);
          } catch (e) {
            failed++;
            console.error(`  FAILED ${item.key}: ${e.message}`);
            continue;
          }
        }
        if (++done % 50 === 0) console.log(`  …${done}/${unused.length}`);
      }
    })
  );

  console.log(`\nDone. ${done - skipped} downloaded, ${skipped} already present, ${failed} failed.`);
  console.log(`Files: ${OUT_DIR}`);
  console.log("Nothing was deleted from Storage.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
