// Create products from scripts/.product-manifest.json — one entry per garment, each with an ordered
// list of source photo filenames (from ~/Downloads/tamak-unused-images/uploads/) already grouped and
// drafted (name/description/color/gender) by a vision review pass.
//
// For each entry: uploads the untouched original + generates -full/-medium/-thumb WebP variants +
// blur placeholder for every photo (same pipeline as src/app/api/admin/upload/route.ts), using the
// Blob-safe uploadImage() helper — never a raw Buffer, that's what corrupted images in production
// before (see src/lib/supabase/storage.ts). Then inserts the product row and a media_library row per
// image, same shape the admin upload route writes.
//
// Usage: node scripts/create-products-from-manifest.mjs [--apply] [--limit=N] [--skip=N]
//   (default is a dry run — report only, no uploads, no DB writes)
//   --skip=N resumes from manifest entry N (0-based) — e.g. after a transient failure partway
//   through a run. nextProductId() reads the DB, so resuming assigns the correct PROD_<n> on its own;
//   --skip only needs to line up with how many manifest entries were already successfully created.
//
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import ws from "ws";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.slice("--limit=".length), 10) : Infinity;
const SKIP_ARG = process.argv.find((a) => a.startsWith("--skip="));
const SKIP = SKIP_ARG ? parseInt(SKIP_ARG.slice("--skip=".length), 10) : 0;

/** Retry transient network/5xx-ish failures a couple of times before giving up. */
async function withRetry(fn, label, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts) throw e;
      const delay = 1000 * 2 ** (i - 1);
      console.warn(`  retry ${i}/${attempts - 1} after "${e.message}" (${label}), waiting ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

const BUCKET = "media";
const SRC_DIR = join(homedir(), "Downloads", "tamak-unused-images", "uploads");
const CATEGORY = "Suits";
const PRICE = 4299;
const STOCK = 10;
const SIZES = ["S", "M", "L", "XL"];
const FABRIC_LINE = "Embroidered suit set";
const VARIANTS = [
  { width: 1200, quality: 82, suffix: "full" },
  { width: 600, quality: 80, suffix: "medium" },
  { width: 150, quality: 75, suffix: "thumb" },
];
// Purely decorative (card frame colour + background motif) — see ProductCard.tsx / CategoryRail.tsx.
// Cycled for visual variety, not derived from the garment.
const PANELS = ["p-maroon", "p-teal", "p-mustard", "p-plum", "p-indigo", "p-terra"];
const TONES = ["m-gold", "m-cream"];
const MOTIFS = ["paisley", "mandala"];

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
const safe = (s) => s.replace(/[^a-zA-Z0-9._-]/g, "_");
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Binary-safe upload — a Blob, never a Buffer (see the note at the top of this file). */
async function uploadImage(key, buf, contentType) {
  return withRetry(async () => {
    const body = new Blob([new Uint8Array(buf)], { type: contentType });
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, body, { contentType, cacheControl: "31536000", upsert: true });
    if (error) throw new Error(`upload ${key}: ${error.message}`);
    return publicUrl(key);
  }, `upload ${key}`);
}

async function assertStoredImageValid(key) {
  return withRetry(async () => {
    const { data, error } = await supabase.storage.from(BUCKET).download(key);
    if (error || !data) throw new Error(`verify ${key}: ${error?.message ?? "no data"}`);
    await sharp(Buffer.from(await data.arrayBuffer())).metadata();
  }, `verify ${key}`);
}

async function nextProductId() {
  const { data, error } = await supabase.from("products").select("id");
  if (error) throw new Error(error.message);
  const max = (data ?? [])
    .map((r) => parseInt(String(r.id).replace(/\D/g, ""), 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return max;
}

async function existingSlugs() {
  const { data, error } = await supabase.from("products").select("data");
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.data?.slug).filter(Boolean));
}

async function main() {
  const manifest = JSON.parse(readFileSync(join(import.meta.dirname, ".product-manifest.json"), "utf8"));
  const entries = manifest.slice(SKIP, SKIP + LIMIT);
  if (SKIP) console.log(`Skipping first ${SKIP} manifest entries (resume).`);

  console.log(APPLY ? "APPLYING (--apply)" : "DRY RUN — nothing will be created (pass --apply to create)");
  console.log(`${entries.length} product(s) from the manifest.\n`);

  let nextNum = (await nextProductId()) + 1;
  const takenSlugs = await existingSlugs();

  let created = 0;
  for (const entry of entries) {
    const id = `PROD_${nextNum}`;
    let slug = slugify(entry.name);
    let suffix = 2;
    while (takenSlugs.has(slug)) {
      slug = `${slugify(entry.name)}-${suffix}`;
      suffix++;
    }
    takenSlugs.add(slug);

    const panel = PANELS[nextNum % PANELS.length];
    const tone = TONES[nextNum % TONES.length];
    const motif = MOTIFS[nextNum % MOTIFS.length];

    console.log(
      `${id}  "${entry.name}"  [${entry.color}, ${entry.gender}]  ${entry.files.length} photo(s): ${entry.files.join(", ")}`
    );

    if (APPLY) {
      const gallery = [];
      for (let i = 0; i < entry.files.length; i++) {
        const srcPath = join(SRC_DIR, entry.files[i]);
        const rawBuffer = readFileSync(srcPath);
        const imgMeta = await sharp(rawBuffer, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
        if (!imgMeta.format || !imgMeta.width || !imgMeta.height) {
          throw new Error(`${entry.files[i]} is not a readable image`);
        }

        const baseName = `${i + 1}-${safe(entry.files[i].replace(/\.[^.]+$/, ""))}`;
        const dirKey = `products/${id}`;
        const relPath = `${id}/${baseName}.webp`;

        await uploadImage(`${dirKey}/${baseName}-original.${imgMeta.format}`, rawBuffer, `image/${imgMeta.format}`);

        const pipeline = sharp(rawBuffer, { limitInputPixels: 40_000_000, failOn: "error" }).rotate();
        const urls = {};
        for (const v of VARIANTS) {
          const out = await pipeline.clone().resize({ width: v.width, withoutEnlargement: true }).webp({ quality: v.quality }).toBuffer();
          urls[v.suffix] = await uploadImage(`${dirKey}/${baseName}-${v.suffix}.webp`, out, "image/webp");
        }
        const blurBuf = await pipeline.clone().resize({ width: 16 }).webp({ quality: 30 }).toBuffer();
        const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

        await assertStoredImageValid(`${dirKey}/${baseName}-thumb.webp`);

        const img = { path: relPath, url: urls.full, thumbUrl: urls.thumb, mediumUrl: urls.medium, fullUrl: urls.full, blurDataURL };
        gallery.push(img);

        const mlId = `${id}-${baseName}`;
        await withRetry(async () => {
          const { error } = await supabase.from("media_library").upsert({
            id: mlId,
            data: {
              path: relPath,
              prefix: `products/${id}`,
              originalStorageKey: `${dirKey}/${baseName}-original.${imgMeta.format}`,
              thumbUrl: urls.thumb,
              mediumUrl: urls.medium,
              fullUrl: urls.full,
              blurDataURL,
              originalWidth: imgMeta.width,
              originalHeight: imgMeta.height,
              fileSizeBytes: rawBuffer.length,
              contentType: `image/${imgMeta.format}`,
              originalFileName: entry.files[i],
              uploadedAt: new Date().toISOString(),
              uploadedBy: "create-products-from-manifest.mjs",
            },
          });
          if (error) throw new Error(`media_library upsert: ${error.message}`);
        }, `media_library ${mlId}`);
      }

      const productData = {
        id,
        tag: "New",
        name: entry.name,
        slug,
        tone,
        color: entry.color,
        motif,
        panel,
        price: PRICE,
        oldPrice: null,
        sizes: SIZES,
        stock: STOCK,
        fabric: FABRIC_LINE,
        gender: entry.gender,
        rating: 4.5,
        reviews: 0,
        category: CATEGORY,
        keywords: `${entry.name} ${entry.color} ${CATEGORY}`.toLowerCase(),
        swatches: [],
        variants: [],
        imagePath: gallery[0].path,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blurDataURL: gallery[0].blurDataURL,
        description: entry.description,
        subcategory: "",
        gallery,
        active: true,
      };

      await withRetry(async () => {
        const { error } = await supabase.from("products").upsert({ id, data: productData });
        if (error) throw new Error(`product upsert ${id}: ${error.message}`);
      }, `product ${id}`);
      console.log(`       created, ${gallery.length} image(s) uploaded and verified`);
    }

    nextNum++;
    created++;
  }

  console.log(`\n${APPLY ? "Created" : "Would create"} ${created} product(s).`);
  if (!APPLY) console.log("Dry run only — re-run with --apply to actually create these.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
