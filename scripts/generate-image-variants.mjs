// One-time backfill: generate the -thumb/-medium/-full WebP variants (same
// pipeline as /api/admin/upload) for every product gallery image that only has
// a raw master, upload them to the Supabase `media` bucket, and write the
// variant URLs onto the product rows. Storefront components already prefer
// thumbUrl/mediumUrl/fullUrl — they just weren't in the data.
//
// Usage: node scripts/generate-image-variants.mjs [--dry-run] [--write-json]
//   --dry-run     report what would be generated, change nothing
//   --write-json  also update the bundled fallback src/data/products.json
//
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import ws from "ws";

config({ path: ".env.local" });

const DRY_RUN = process.argv.includes("--dry-run");
const WRITE_JSON = process.argv.includes("--write-json");
const MIRROR = "/home/anmolramgarhia/Downloads/firebase-storage-images";
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

const PUBLIC_BASE = `${URL_}/storage/v1/object/public/${BUCKET}/`;
const publicUrl = (key) => PUBLIC_BASE + encodeURI(key);

const stats = { entries: 0, ok: 0, generated: 0, missing: 0, failed: 0 };
// cache: master key -> { thumbUrl, mediumUrl, fullUrl } | null (unrecoverable)
const done = new Map();

async function urlAlive(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

// Storage key of the master for a gallery entry.
function masterKey(entry) {
  const u = entry.url || "";
  if (u.startsWith(PUBLIC_BASE)) return decodeURI(u.slice(PUBLIC_BASE.length));
  if (entry.path) return `products/${entry.path}`;
  return null;
}

async function readMaster(key) {
  const local = join(MIRROR, key);
  if (existsSync(local)) return readFileSync(local);
  const r = await fetch(publicUrl(key));
  if (!r.ok) return null;
  return Buffer.from(await r.arrayBuffer());
}

async function generateFor(key) {
  if (done.has(key)) return done.get(key);

  const dot = key.lastIndexOf(".");
  const base = dot > 0 ? key.slice(0, dot) : key;
  const urls = {
    thumbUrl: publicUrl(`${base}-thumb.webp`),
    mediumUrl: publicUrl(`${base}-medium.webp`),
    fullUrl: publicUrl(`${base}-full.webp`),
  };

  // Already generated on a previous run?
  if (await urlAlive(urls.thumbUrl)) {
    done.set(key, urls);
    return urls;
  }

  const buf = await readMaster(key);
  if (!buf) {
    done.set(key, null);
    return null;
  }
  if (DRY_RUN) {
    console.log(`[dry-run] would generate variants for ${key}`);
    done.set(key, urls);
    return urls;
  }

  const pipeline = sharp(buf).rotate();
  for (const v of VARIANTS) {
    const out = await pipeline
      .clone()
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality })
      .toBuffer();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${base}-${v.suffix}.webp`, out, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`${base}-${v.suffix}.webp: ${error.message}`);
  }
  stats.generated++;
  if (stats.generated % 25 === 0) console.log(`  ${stats.generated} masters processed…`);
  done.set(key, urls);
  return urls;
}

// Adds variant URLs to one gallery entry. Returns true if the entry changed.
async function processEntry(entry) {
  stats.entries++;
  if (entry.thumbUrl && (await urlAlive(entry.thumbUrl))) {
    stats.ok++;
    return false;
  }
  const key = masterKey(entry);
  if (!key) {
    stats.missing++;
    return false;
  }
  try {
    const urls = await generateFor(key);
    if (!urls) {
      console.warn(`✗ master missing everywhere: ${key}`);
      stats.missing++;
      return false;
    }
    Object.assign(entry, urls);
    return true;
  } catch (e) {
    stats.failed++;
    console.error(`✗ ${key}: ${e.message}`);
    return false;
  }
}

async function processProduct(data) {
  let changed = false;
  for (const g of data.gallery ?? []) if (await processEntry(g)) changed = true;
  for (const v of data.variants ?? [])
    for (const g of v.gallery ?? []) if (await processEntry(g)) changed = true;
  return changed;
}

// ── Products in Supabase ────────────────────────────────────────────────────
const { data: rows, error } = await supabase.from("products").select("id,data");
if (error) { console.error(error.message); process.exit(1); }
console.log(`${rows.length} products in Supabase`);

const updated = [];
for (const row of rows) {
  if (await processProduct(row.data)) updated.push({ id: row.id, data: row.data });
}

if (!DRY_RUN && updated.length) {
  for (let i = 0; i < updated.length; i += 200) {
    const { error: upErr } = await supabase
      .from("products")
      .upsert(updated.slice(i, i + 200), { onConflict: "id" });
    if (upErr) { console.error(upErr.message); process.exit(1); }
  }
}
console.log(`Updated ${updated.length} product rows${DRY_RUN ? " (dry-run: not written)" : ""}.`);

// ── Bundled fallback src/data/products.json ────────────────────────────────
if (WRITE_JSON) {
  const path = "src/data/products.json";
  const products = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;
  for (const p of products) if (await processProduct(p)) changed++;
  if (!DRY_RUN && changed) writeFileSync(path, JSON.stringify(products, null, 2) + "\n");
  console.log(`products.json: ${changed} products updated${DRY_RUN ? " (dry-run)" : ""}.`);
}

console.log("Summary:", stats);
if (stats.failed > 0) process.exit(1);
