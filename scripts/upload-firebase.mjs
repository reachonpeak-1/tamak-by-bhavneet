// Phase 0 — upload optimized masters to Firebase Storage.
//
// Origin store for product photos. next/image (on Vercel) then resizes them to
// AVIF/WebP at the exact display size and caches at the edge → very fast loads.
//
// Setup (once):
//   1. Firebase console → create project → Build → Storage → get started.
//   2. Project settings → Service accounts → Generate new private key (JSON).
//   3. Make product images publicly readable (Storage rules allow read on
//      products/**, or this script sets each object public via predefinedAcl).
//
// Env (.env.local or shell):
//   FIREBASE_ADMIN_PROJECT_ID=...
//   FIREBASE_ADMIN_CLIENT_EMAIL=...
//   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//   FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com   (or .firebasestorage.app)
//
// Install dep:  npm i -D firebase-admin
// Run:          node scripts/upload-firebase.mjs
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_source", "optimized");
const PREFIX = "products";

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET } =
  process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY || !FIREBASE_STORAGE_BUCKET) {
  console.error("Missing FIREBASE_ADMIN_* / FIREBASE_STORAGE_BUCKET env vars. See header of this file.");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
  storageBucket: FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage().bucket();

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name.endsWith(".jpg")) yield p;
  }
}

// public URL for an uploaded object (bucket must allow public read on products/**)
const publicUrl = (key) =>
  `https://storage.googleapis.com/${FIREBASE_STORAGE_BUCKET}/${key}`;

const urlMap = {};
let n = 0;
for (const file of walk(OUT)) {
  const rel = file.slice(OUT.length + 1).split("\\").join("/");
  const key = `${PREFIX}/${rel}`;
  await bucket.upload(file, {
    destination: key,
    metadata: {
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    },
    predefinedAcl: "publicRead",
  });
  urlMap[rel] = publicUrl(key); // rel = "PROD_1/1.jpg"
  n++;
  if (n % 20 === 0) console.log(`  uploaded ${n}...`);
}

writeFileSync(join(OUT, "image-urls.json"), JSON.stringify(urlMap, null, 2));
console.log(`\nDone. Uploaded ${n} objects to gs://${FIREBASE_STORAGE_BUCKET}/${PREFIX}/`);
console.log("Wrote _source/optimized/image-urls.json (used by the Firestore seed).");
