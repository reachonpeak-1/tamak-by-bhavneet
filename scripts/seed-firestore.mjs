// Seed Firestore `products` with the full catalog (all 85 products).
//
// Merges real image URLs from _source/optimized/image-urls.json if present
// (created by scripts/upload-firebase.mjs). Run AFTER uploading images, or
// before — URLs will be filled in on a later run.
//
// Env: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
// Install dep: npm i -D firebase-admin  (already a dependency)
// Run: node scripts/seed-firestore.mjs
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(ROOT, "src", "data", "products.json"), "utf8"));

const urlsPath = join(ROOT, "_source", "optimized", "image-urls.json");
const urlMap = existsSync(urlsPath) ? JSON.parse(readFileSync(urlsPath, "utf8")) : {};
if (!Object.keys(urlMap).length) {
  console.warn("⚠ No image-urls.json — seeding with image PATHS only. Run upload-firebase.mjs, then re-seed.");
}

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error("Missing FIREBASE_ADMIN_* env vars.");
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

let n = 0;
let batch = db.batch();
for (const p of catalog) {
  const gallery = (p.gallery ?? []).map((g) => ({ ...g, url: urlMap[g.path] ?? null }));
  const doc = {
    ...p,
    image: urlMap[p.imagePath] ?? null,
    gallery,
    updatedAt: new Date().toISOString(),
  };
  batch.set(db.collection("products").doc(p.id), doc, { merge: true });
  n++;
  if (n % 400 === 0) {
    await batch.commit();
    batch = db.batch();
  }
}
await batch.commit();
console.log(`Seeded ${n} products into Firestore.`);
