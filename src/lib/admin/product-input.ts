import "server-only";
import type { Product } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// Shared field sanitisers — also reused by the spreadsheet import (product-sheet.ts).
export const num = (v: unknown, min = 0) => Math.max(min, Math.round(Number(v) || 0));
export const str = (v: unknown) => String(v ?? "").trim();
export const arr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map((x) => String(x).trim()).filter(Boolean)
    : typeof v === "string"
      ? v.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

type GalleryIn = { path?: string; blurDataURL?: string; url?: string; thumbUrl?: string; mediumUrl?: string; fullUrl?: string };

// Keeps each image's path + blur, and PRESERVES an absolute (Firebase Storage)
// url when the uploader provides one — so admin-uploaded images resolve even
// when the storefront serves seed images locally. Local "/path" urls are
// ignored (they're re-derived at read time). Firestore rejects undefined, so
// url is only set when present.
const galleryOf = (v: unknown): { path: string; blurDataURL: string; url?: string }[] =>
  Array.isArray(v)
    ? (v as GalleryIn[])
        .map((g) => {
          const url = str(g.url);
          const item: Record<string, string | undefined> & { path: string; blurDataURL: string } = {
            path: str(g.path),
            blurDataURL: str(g.blurDataURL),
          };
          if (/^https?:\/\//.test(url)) item.url = url;
          // Preserve optimized variant URLs from Sharp
          for (const k of ["thumbUrl", "mediumUrl", "fullUrl"] as const) {
            const v = str((g as Record<string, unknown>)[k]);
            if (/^https?:\/\//.test(v)) item[k] = v;
          }
          return item;
        })
        .filter((g) => g.path)
    : [];

// Normalises raw editor input into a clean Firestore product document (no id /
// timestamps — those are set by the route). Never trusts client numbers.
export function normalizeProduct(b: Record<string, unknown>) {
  const gallery = galleryOf(b.gallery);
  const variants = Array.isArray(b.variants)
    ? (b.variants as Record<string, unknown>[])
        .map((v) => ({
          name: str(v.name),
          hex: str(v.hex) || "#cccccc",
          stock: num(v.stock),
          gallery: galleryOf(v.gallery),
        }))
        .filter((v) => v.name)
    : [];
  const out = {
    name: str(b.name),
    slug: slugify(str(b.slug) || str(b.name)),
    fabric: str(b.fabric),
    price: num(b.price),
    oldPrice: b.oldPrice ? num(b.oldPrice) : null,
    tag: str(b.tag) || null,
    category: str(b.category),
    subcategory: str(b.subcategory),
    color: str(b.color),
    gender: str(b.gender) || "Women",
    description: str(b.description),
    keywords: str(b.keywords),
    sizes: arr(b.sizes),
    stock: num(b.stock),
    rating: Math.min(5, Number(b.rating) || 4.5),
    reviews: num(b.reviews),
    swatches: arr(b.swatches),
    panel: (str(b.panel) || "p-indigo") as Product["panel"],
    motif: (str(b.motif) || "paisley") as Product["motif"],
    tone: (str(b.tone) || "m-gold") as Product["tone"],
    imagePath: gallery[0]?.path || str(b.imagePath) || null,
    blurDataURL: str(b.blurDataURL) || gallery[0]?.blurDataURL || "",
    gallery,
    variants,
    active: b.active !== false,
  };
  return out;
}

// Highest numeric suffix currently used across PROD_<n> doc ids. The spreadsheet
// import reads this once and increments locally to mint ids for a batch of new
// rows without re-querying per row.
export async function currentMaxProductNum(): Promise<number> {
  const snap = await adminDb().collection("products").get();
  return snap.docs.reduce((m, d) => Math.max(m, Number(d.id.replace(/\D/g, "")) || 0), 0);
}

// Next free product id, e.g. "PROD_86".
export async function nextProductId(): Promise<string> {
  return `PROD_${(await currentMaxProductNum()) + 1}`;
}
