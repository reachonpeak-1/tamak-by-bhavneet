// One-time migration: copy all Firestore collections into Supabase Postgres.
//
// Per document:
//  - Firestore Timestamp values → ISO strings (recursive)
//  - Firebase Storage URLs → Supabase public storage URLs (recursive)
//  - orders/subscribers/campaigns get a backfilled createdAt if missing
//  - subscribers deduped by lowercased email (oldest kept)
//
// Usage: node scripts/migrate/firestore-to-supabase.mjs [--only=products]
// Env (.env.local): FIREBASE_ADMIN_*, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//                   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY
import { config } from "dotenv";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

config({ path: ".env.local" });

const only = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];

const {
  FIREBASE_ADMIN_PROJECT_ID,
  FIREBASE_ADMIN_CLIENT_EMAIL,
  FIREBASE_ADMIN_PRIVATE_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SECRET_KEY,
} = process.env;
const fbBucket =
  process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Missing FIREBASE_ADMIN_* env vars.");
  process.exit(1);
}
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY.");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});

const SUPA_PUBLIC = `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;

function rewriteUrl(s) {
  if (!fbBucket || typeof s !== "string") return s;
  // https://storage.googleapis.com/<bucket>/<key>
  const gcs = `https://storage.googleapis.com/${fbBucket}/`;
  if (s.startsWith(gcs)) return SUPA_PUBLIC + s.slice(gcs.length);
  // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-key>?alt=media...
  const fb = `https://firebasestorage.googleapis.com/v0/b/${fbBucket}/o/`;
  if (s.startsWith(fb)) {
    const rest = s.slice(fb.length);
    const key = decodeURIComponent(rest.split("?")[0]);
    return SUPA_PUBLIC + key;
  }
  return s;
}

// Recursive: Timestamps → ISO strings, storage URLs rewritten.
function transform(v) {
  if (v == null) return v;
  if (typeof v === "string") return rewriteUrl(v);
  if (typeof v.toDate === "function") return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(transform);
  if (typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = transform(val);
    return out;
  }
  return v;
}

const EPOCH = "1970-01-01T00:00:00.000Z";

async function readCollection(name) {
  const snap = await db.collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, data: transform(d.data()) }));
}

async function upsertChunked(table, rows, { withId = true } = {}) {
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows
      .slice(i, i + CHUNK)
      .map((r) => (withId ? { id: r.id, data: r.data } : { data: r.data }));
    const { error } = withId
      ? await supabase.from(table).upsert(chunk, { onConflict: "id" })
      : await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const report = [];

async function migrate(fsName, table, opts = {}) {
  if (only && only !== fsName && only !== table) return;
  const rows = await readCollection(fsName);
  let final = rows;

  if (opts.backfillCreatedAt) {
    for (const r of final) if (!r.data.createdAt) r.data.createdAt = EPOCH;
  }
  if (opts.dedupeByEmail) {
    const byEmail = new Map();
    for (const r of final) {
      const email = String(r.data.email || "").toLowerCase().trim();
      if (!email) continue;
      const prev = byEmail.get(email);
      // keep oldest
      if (!prev || String(r.data.createdAt) < String(prev.data.createdAt)) byEmail.set(email, r);
    }
    final = [...byEmail.values()];
  }

  if (opts.appendOnly) {
    // audit_log has an identity PK; wipe and re-insert for idempotent re-runs.
    const { error } = await supabase.from(table).delete().gte("id", 0);
    if (error) throw new Error(`${table} clear: ${error.message}`);
    await upsertChunked(table, final, { withId: false });
  } else {
    await upsertChunked(table, final);
  }
  report.push({ collection: fsName, table, firestore: rows.length, written: final.length });
  console.log(`✓ ${fsName} → ${table}: ${final.length}/${rows.length}`);
}

await migrate("products", "products");
await migrate("orders", "orders", { backfillCreatedAt: true });
await migrate("categories", "categories");
await migrate("content", "content");
await migrate("settings", "settings");
await migrate("subscribers", "subscribers", { backfillCreatedAt: true, dedupeByEmail: true });
await migrate("campaigns", "campaigns", { backfillCreatedAt: true });
await migrate("auditLog", "audit_log", { appendOnly: true });
await migrate("mediaLibrary", "media_library");

console.table(report);
console.log("Done.");
