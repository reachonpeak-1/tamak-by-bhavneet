// Phase 0 — local image optimization.
//
// Reads _source/descriptions.json (real product photos), and for each photo
// produces ONE web-ready master (max 1600px wide, stripped, progressive,
// quality 82) under _source/optimized/<product_id>/<n>.jpg.
//
// Cloudflare Image Transformations then generate every responsive width +
// AVIF/WebP on the fly from these masters — so we only store one file each.
//
// Also generates a tiny blur placeholder (base64) per image and writes
// _source/optimized/manifest.json for the Firestore seed step.
//
// Requires ImageMagick (`magick`). Run: node scripts/optimize-images.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "_source", "raw_images");
const OUT = join(ROOT, "_source", "optimized");
const DESC = join(ROOT, "_source", "descriptions.json");

const MAX_W = 1600;
const QUALITY = 82;

const rows = JSON.parse(readFileSync(DESC, "utf8"));

// group rows by product_id, preserving order
const byProduct = new Map();
for (const r of rows) {
  if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, []);
  byProduct.get(r.product_id).push(r);
}

mkdirSync(OUT, { recursive: true });

const manifest = [];
let done = 0,
  skipped = 0;

for (const [pid, items] of byProduct) {
  const dir = join(OUT, pid);
  mkdirSync(dir, { recursive: true });
  const images = [];
  items.forEach((r, i) => {
    const src = join(RAW, r.filename);
    if (!existsSync(src)) {
      skipped++;
      return;
    }
    const n = i + 1;
    const dest = join(dir, `${n}.jpg`);
    // resize master
    execFileSync("magick", [
      src,
      "-auto-orient",
      "-resize",
      `${MAX_W}x${MAX_W}>`,
      "-strip",
      "-interlace",
      "Plane",
      "-quality",
      String(QUALITY),
      dest,
    ]);
    // tiny blur placeholder (base64 jpeg, ~20px)
    const blurBuf = execFileSync("magick", [
      src,
      "-auto-orient",
      "-resize",
      "20x20",
      "-strip",
      "-quality",
      "40",
      "jpg:-",
    ]);
    const blur = `data:image/jpeg;base64,${blurBuf.toString("base64")}`;
    images.push({ key: `${pid}/${n}.jpg`, blurDataURL: blur });
    done++;
    if (done % 20 === 0) process.stdout.write(`  ${done} images optimized...\n`);
  });

  const first = items[0];
  manifest.push({
    product_id: pid,
    title: first.suggested_title,
    category: first.garment_type,
    color: first.color,
    description: first.description,
    keywords: first.keywords,
    gender: first.gender,
    images,
  });
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nDone. ${done} images optimized, ${skipped} missing/skipped.`);
console.log(`Manifest: _source/optimized/manifest.json (${manifest.length} products)`);
