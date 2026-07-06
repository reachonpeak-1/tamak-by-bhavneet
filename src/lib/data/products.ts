// Server-only product data layer. Firestore `products` is the SOURCE OF TRUTH;
// the bundled src/data/products.json is only a seed/fallback so the storefront
// still renders before the collection is seeded or if Firestore is unreachable.
//
// Reads are cached with unstable_cache (tag "products") and deduped per-render
// with React cache(). Admin mutations call revalidateTag("products", {expire:0})
// to refresh immediately (see src/lib/revalidate.ts).
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Product, GalleryImage, Variant } from "@/lib/types";
import { adminDb } from "@/lib/firebase/admin";
import raw from "@/data/products.json";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
// "storage" once images are uploaded to Firebase Storage + bucket made public;
// "local" serves the committed copies under /public/products (default for dev).
const IMAGE_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_ORIGIN ?? "local";

/** Resolve a Storage object key (e.g. "products/PROD_1/1.jpg") to a delivery URL. */
export function storageUrl(key?: string): string | undefined {
  if (!key) return undefined;
  if (IMAGE_ORIGIN === "storage" && BUCKET) {
    return `https://storage.googleapis.com/${BUCKET}/${key}`;
  }
  return `/${key}`; // local: /public/products/PROD_x/n.jpg
}

type RawImage = { path: string; blurDataURL: string; url?: string; thumbUrl?: string; mediumUrl?: string; fullUrl?: string };
type RawProduct = Record<string, unknown> & {
  imagePath?: string;
  gallery?: RawImage[];
  variants?: { name: string; hex: string; stock: number; gallery?: RawImage[] }[];
};

// Prefer a stored absolute url (admin-uploaded → Firebase Storage); otherwise
// derive from the path via the configured origin (seed images served locally).
const hydrateGallery = (imgs?: RawImage[]): GalleryImage[] =>
  (imgs ?? []).map((g) => ({
    path: g.path,
    blurDataURL: g.blurDataURL,
    url: g.url && /^https?:\/\//.test(g.url) ? g.url : storageUrl(`products/${g.path}`),
    thumbUrl: g.thumbUrl,
    mediumUrl: g.mediumUrl,
    fullUrl: g.fullUrl,
  }));

function hydrate(p: RawProduct): Product {
  const variants: Variant[] = (p.variants ?? []).map((v) => ({
    name: v.name,
    hex: v.hex,
    stock: v.stock,
    gallery: hydrateGallery(v.gallery),
  }));
  return {
    ...(p as unknown as Product),
    subcategory: (p.subcategory as string) ?? "",
    image: p.imagePath ? storageUrl(`products/${p.imagePath}`) : undefined,
    gallery: hydrateGallery(p.gallery),
    variants,
  };
}

/** PROD_10 should sort after PROD_2 — order by the trailing number. */
const idNum = (id: string) => Number(String(id).replace(/\D/g, "")) || 0;
const byId = (a: Product, b: Product) => idNum(a.id) - idNum(b.id);

// Raw read straight from Firestore (no ISR cache). Falls back to the seed.
async function readProductsFromDb(): Promise<Product[]> {
  try {
    const snap = await adminDb().collection("products").get();
    if (!snap.empty) return snap.docs.map((d) => hydrate(d.data() as RawProduct)).sort(byId);
  } catch (e) {
    console.error("[products] Firestore read failed, using bundled seed:", (e as Error).message);
  }
  return (raw as unknown as RawProduct[]).map(hydrate).sort(byId);
}

const fetchAll = unstable_cache(readProductsFromDb, ["products:all"], { tags: ["products"], revalidate: 3600 });

/** Storefront read — cached (ISR), invalidated on admin save via revalidateTag("products"). */
export const getAllProducts = cache((): Promise<Product[]> => fetchAll());

/**
 * Admin read — always fresh from Firestore so edits/creates reflect immediately,
 * without waiting for the ISR cache tag to purge. React-cache()d to dedupe within
 * a single request render.
 */
export const getAllProductsFresh = cache((): Promise<Product[]> => readProductsFromDb());

export const getCategories = cache(async (): Promise<string[]> =>
  Array.from(new Set((await getAllProducts()).map((p) => p.category))).sort()
);

export const getNewIn = cache(async (): Promise<Product[]> =>
  (await getAllProducts()).filter((p) => p.tag === "New").slice(0, 12)
);

export const getMostLoved = cache(async (): Promise<Product[]> =>
  [...(await getAllProducts())].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 12)
);

export const getProduct = cache(async (slug: string): Promise<Product | undefined> =>
  (await getAllProducts()).find((p) => p.slug === slug)
);

export const byCategory = cache(async (cat: string): Promise<Product[]> =>
  (await getAllProducts()).filter((p) => p.category.toLowerCase() === cat.toLowerCase())
);
