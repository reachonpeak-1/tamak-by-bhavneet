// Upload a local mirror of the Firebase Storage bucket to the Supabase `media`
// bucket, preserving relative paths as object keys. Used because the Firebase
// project's billing is delinquent and blocks downloads — the local folder
// (~/Downloads/firebase-storage-images) is the recovery source.
//
// Usage: node scripts/migrate/storage-local-to-supabase.mjs [folder]
// Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

config({ path: ".env.local" });

const SRC = process.argv[2] || "/home/anmolramgarhia/Downloads/firebase-storage-images";
const BUCKET = "media";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".pdf": "application/pdf",
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(SRC);
console.log(`${files.length} local files under ${SRC}`);

let copied = 0, skipped = 0, failed = 0;
const queue = [...files];
const CONCURRENCY = 8;

async function worker() {
  for (;;) {
    const p = queue.shift();
    if (!p) return;
    const key = relative(SRC, p).split("\\").join("/");
    try {
      const head = await fetch(
        `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURI(key)}`,
        { method: "HEAD" }
      );
      if (head.ok) { skipped++; continue; }
      const buf = readFileSync(p);
      const contentType = MIME[extname(key).toLowerCase()] || "application/octet-stream";
      const { error } = await supabase.storage.from(BUCKET).upload(key, buf, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw error;
      copied++;
      if (copied % 50 === 0) console.log(`  ${copied} copied…`);
    } catch (e) {
      failed++;
      console.error(`✗ ${key}: ${e.message || e}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`Done. copied=${copied} skipped(existing)=${skipped} failed=${failed}`);
if (failed > 0) process.exit(1);
