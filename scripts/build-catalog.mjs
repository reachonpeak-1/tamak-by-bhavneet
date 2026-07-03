// Build the committed product catalog from the real source data.
//
// Inputs:  _source/descriptions.json  (metadata: type/color/pattern/material…)
//          _source/optimized/manifest.json  (image keys + blur placeholders)
// Output:  src/data/products.json  (ALL 85 products, fully populated)
//
// Image fields store the Firebase Storage object PATH (products/PROD_x/n.jpg).
// The app builds the full URL from NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET at runtime;
// until images are uploaded the cards fall back to the woven-motif placeholder.
//
// Prices/ratings/stock are reasonable generated defaults (no price in source) —
// editable later in the admin panel. Generation is deterministic (seeded by id).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const desc = JSON.parse(readFileSync(join(ROOT, "_source", "descriptions.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "_source", "optimized", "manifest.json"), "utf8"));
const blurByKey = new Map();
for (const p of manifest) for (const img of p.images) blurByKey.set(img.key, img.blurDataURL);

// rows grouped by product, first row = representative metadata
const byId = new Map();
for (const r of desc) if (!byId.has(r.product_id)) byId.set(r.product_id, r);

// deterministic pseudo-random from a string seed
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const PANELS = ["p-maroon", "p-teal", "p-mustard", "p-plum", "p-indigo", "p-terra"];
const MOTIFS = ["paisley", "mandala"];
const TONES = ["m-gold", "m-cream"];

const COLOR_HEX = {
  red: "#8a2b3c", maroon: "#5e1b2b", pink: "#c85a7c", rose: "#b34a64", magenta: "#9c2a5c",
  orange: "#c0562f", terracotta: "#7e3318", rust: "#8a4a25", peach: "#e0a07a",
  yellow: "#c98a2b", mustard: "#b8860b", gold: "#a9823a", cream: "#e9ddca", ivory: "#f0e7d8", beige: "#d8c4a8",
  green: "#1f6b63", emerald: "#0e3f3c", olive: "#5a5a2a", teal: "#1f6b63",
  blue: "#33417e", navy: "#1c2447", indigo: "#283593", "sky blue": "#5a8fc0",
  purple: "#6c3a72", plum: "#3f2148", lavender: "#9a83b8", violet: "#5e3a7e",
  black: "#23201c", grey: "#6a584a", gray: "#6a584a", white: "#f0e7d8", brown: "#6f4f37", "off-white": "#efe6d6",
  multicolor: "#a9823a", multi: "#a9823a",
};
const colorHex = (c) => {
  if (!c) return "#a9823a";
  const k = c.toLowerCase().trim();
  if (COLOR_HEX[k]) return COLOR_HEX[k];
  for (const [name, hex] of Object.entries(COLOR_HEX)) if (k.includes(name)) return hex;
  return "#a9823a";
};

// normalize the messy garment_type values into clean shop categories
function normCategory(t) {
  const s = (t || "").toLowerCase();
  if (s.includes("saree")) return "Sarees";
  if (s.includes("lehenga")) return "Lehengas";
  if (s.includes("salwar") || s.includes("suit")) return "Suits";
  if (s.includes("dupatta") || s.includes("shawl") || s.includes("scarf") || s.includes("wrap") || s.includes("stole"))
    return "Dupattas";
  if (s.includes("kurti")) return "Kurtis";
  if (s.includes("kurta") || s.includes("tunic")) return "Kurtas";
  if (s.includes("dress")) return "Dresses";
  if (s.includes("belt") || s.includes("accessor") || s.includes("jewel")) return "Accessories";
  return "Kurtas";
}

// base price band per category (INR)
const PRICE_BAND = {
  Sarees: [6000, 14000], Lehengas: [18000, 60000], Suits: [3500, 8500], Kurtas: [1800, 4500],
  Kurtis: [1500, 3500], Dupattas: [900, 2600], Dresses: [2500, 5500], Accessories: [600, 1500],
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const products = [];
const seenSlug = new Set();

for (const p of manifest) {
  const meta = byId.get(p.product_id) || {};
  const id = p.product_id; // PROD_1
  const seed = hash(id);
  const name = (p.title || meta.suggested_title || `${meta.color || ""} ${meta.garment_type || "Piece"}`).trim();

  let slug = slugify(name);
  if (!slug) slug = slugify(id);
  if (seenSlug.has(slug)) slug = `${slug}-${id.toLowerCase()}`;
  seenSlug.add(slug);

  const category = normCategory(meta.garment_type || p.category);
  const [lo, hi] = PRICE_BAND[category] || [2000, 5000];
  let price = lo + (seed % (hi - lo));
  price = Math.round(price / 100) * 100 - 1; // .99-style
  const onSale = seed % 4 === 0;
  const oldPrice = onSale ? Math.round((price * 1.18) / 100) * 100 - 1 : undefined;

  const rating = +(4.5 + ((seed >> 3) % 5) / 10).toFixed(1); // 4.5–4.9
  const reviews = 12 + ((seed >> 5) % 240);

  const fabricBits = [meta.material_guess, meta.pattern].filter(Boolean);
  const fabric = fabricBits.length ? fabricBits.join(" · ") : `${category} · handcrafted`;

  const isAccessory = category === "Dupattas" || category === "Accessories";
  const sizes = isAccessory ? ["One Size"] : ["XS", "S", "M", "L", "XL", "XXL"];

  const gallery = p.images.map((img) => ({ path: img.key, blurDataURL: img.blurDataURL }));

  const swPrimary = colorHex(meta.color);
  const accents = ["#a9823a", "#1f6b63", "#5e1b2b"].filter((c) => c !== swPrimary).slice(0, 2);

  products.push({
    id,
    slug,
    name,
    fabric,
    price,
    oldPrice,
    tag: onSale ? "Sale" : rating >= 4.8 ? "Bestseller" : seed % 3 === 0 ? "New" : undefined,
    category,
    color: meta.color || "",
    gender: meta.gender || "Women",
    description: meta.description || "",
    keywords: meta.keywords || "",
    sizes,
    stock: 8 + (seed % 20),
    rating,
    reviews,
    swatches: [swPrimary, ...accents],
    panel: PANELS[seed % PANELS.length],
    motif: MOTIFS[seed % MOTIFS.length],
    tone: TONES[seed % TONES.length],
    imagePath: gallery[0]?.path,
    blurDataURL: gallery[0]?.blurDataURL,
    gallery,
  });
}

mkdirSync(join(ROOT, "src", "data"), { recursive: true });
writeFileSync(join(ROOT, "src", "data", "products.json"), JSON.stringify(products, null, 2));

const counts = {};
for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;
console.log(`Wrote src/data/products.json — ${products.length} products`);
console.log("By category:", counts);
