// Seed Firestore `categories` with the 12 Tamak categories + their subcategories.
//
// REPLACES the collection: deletes every existing category doc, then writes the
// 12 below. Photos are NOT seeded (image: "") — the admin category form requires
// a photo, so upload one per category in Admin → Categories after seeding. The
// homepage rail simply renders no photo for image-less categories until then.
//
// Category `name` is canonical: it equals each product's `category`, and each
// `subs` entry equals a product's `subcategory`. Names/subs are verbatim from
// TAMAK CATEGORIES.xlsx (incl. source typos) — edit later in the admin if needed.
//
// Env: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
// Run: node scripts/seed-categories.mjs   (or: npm run seed:categories)
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// [name, [subcategories...]] in display order.
const CATEGORIES = [
  ["BANARSEE", ["KORRA SILK SUITS", "KORRA SILK SAREES", "CHINIA SILK SUITS", "KATAN SILK SUITS", "MUNGA SILK SUITS", "RAW SILK SUITS", "TUSSAR SILK SUITS", "TISSUE SILK SUITS", "LINEN SILK SUITS", "PURE CREPE SILK SUITS", "PURE GEORGET SUITS", "BANARSEE MASHROO SILK SUITS", "TANCHOI YARDAGES", "PLAIN KATAN SILK YARDAGES", "TANCHOI SILK SAREES", "KATAAN SILK SAREES", "TISSUE SILK SAREES", "RAW MANGO SILK SUITS", "RAW MANGO SILK SAREES"]],
  ["CHIKANKARI", ["MULL CHANDERI", "ORGANZA SILK", "PURE KATAN SILK", "MUNGA SILK", "TUSSAR SILK", "COTTON SILK CHANDERI", "VELVET SUITS", "ORGANZA SILK SAREES", "TUSSAR SILK SAREES", "GACCHI SILK SAREES", "CHANDERI SILK SAREES"]],
  ["IKKAT", ["IKKAT MULBERY SILK YARDAGES", "UZBEIK SILK YARDAGES", "RAW SILK IKKAT YARDAGES", "IKKAT SILK DUPPATTAS", "MERCEDISED COTTON IKKAT SUITS", "COTTON UZBEIK IKKAT YARDAGES", "IKKAT SILK SAREES", "TELLIA RUMAL YARDAGES", "TELLIA RUMAL SILK SAREES"]],
  ["KALAMKARI", ["TUSSAR SILK DUPPATTAS", "TUSSAR SILK SAREES"]],
  ["PHULKARI", ["DUPPATTAS", "ORGANZA SILK SUITS", "TUSSAR SILK SUITS", "CREPE SILK SUITS", "RAW SILK SUITS", "VELVET SILK SUITS", "TUSSAR SILK SAREES", "MUNGA SILK SAREES", "ORGANZA SILK SAREES"]],
  ["RAJKOT PATOLAS", ["PATOLA YARDAGES", "SAREES", "SUITS", "DUPPATTAS", "RAW SILK SAREE", "TISUE SILK SUIT", "TISSUE SILK SAREE", "LEHENGAS"]],
  ["AJRAKH", ["COTTON YADAGES", "COTTON SUITS", "MODAL YARDAGES", "MODAL SUITS", "KOTTA SILK SUITS", "CREPE SILK SAREES", "VELVET YARDAGES", "MULL CHANDERI SUITS", "CHANDERI SILK SUITS"]],
  ["PAITHNI", ["DUPPATTAS", "SAREES"]],
  ["LAMBANI", ["KALA COTTON KURTAS", "KALA COTTON SUITS", "MULL CHANDERI SUITS", "TUSSAR SILK SUITS"]],
  ["KANTHA", ["TUSSAR SILK DUPPATAS", "MULBERRY SILK DUPPATTAS"]],
  ["SOZNI/KASHMIRI", []],
  ["BANDHEJ", []],
];

const PANELS = ["p-maroon", "p-teal", "p-mustard", "p-plum", "p-indigo", "p-terra"];

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
const col = db.collection("categories");
const now = new Date().toISOString();

// 1. Clear existing categories.
const existing = await col.get();
if (!existing.empty) {
  const delBatch = db.batch();
  existing.docs.forEach((d) => delBatch.delete(d.ref));
  await delBatch.commit();
  console.log(`Deleted ${existing.size} existing categories.`);
}

// 2. Write the 12.
const batch = db.batch();
CATEGORIES.forEach(([name, subs], i) => {
  const doc = {
    id: slugify(name),
    name,
    deva: "",
    cnt: "",
    image: "",
    pos: "center top",
    panel: PANELS[i % PANELS.length],
    tone: "m-gold",
    motif: i % 2 === 0 ? "paisley" : "mandala",
    subs,
    order: i,
    createdAt: now,
  };
  batch.set(col.doc(doc.id), doc);
});
await batch.commit();
console.log(`Seeded ${CATEGORIES.length} categories. Remember to upload a photo for each in Admin → Categories.`);
