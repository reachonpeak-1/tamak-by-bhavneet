// Server-only product data layer. The Supabase `products` table is the SOURCE
// OF TRUTH; the bundled src/data/products.json is only a seed/fallback so the
// storefront still renders before the table is seeded or if Supabase is
// unreachable.
//
// Reads are cached with unstable_cache (tag "products") and deduped per-render
// with React cache(). Admin mutations call revalidateTag("products", {expire:0})
// to refresh immediately (see src/lib/revalidate.ts).
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Product, GalleryImage, Variant } from "@/lib/types";
import { supabaseAdmin, publicStorageUrl } from "@/lib/supabase/admin";
import raw from "@/data/products.json";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// "storage" once images are uploaded to Supabase Storage (public `media` bucket);
// "local" serves the committed copies under /public/products (default for dev).
const IMAGE_ORIGIN = process.env.NEXT_PUBLIC_IMAGE_ORIGIN ?? "local";

/** Resolve a Storage object key (e.g. "products/PROD_1/1.jpg") to a delivery URL. */
export function storageUrl(key?: string): string | undefined {
  if (!key) return undefined;
  if (IMAGE_ORIGIN === "storage" && SUPABASE_URL) {
    return publicStorageUrl(key);
  }
  return `/${key}`; // local: /public/products/PROD_x/n.jpg
}

type RawImage = { path: string; blurDataURL: string; url?: string; thumbUrl?: string; mediumUrl?: string; fullUrl?: string };
type RawProduct = Record<string, unknown> & {
  imagePath?: string;
  gallery?: RawImage[];
  variants?: { name: string; hex: string; stock: number; gallery?: RawImage[] }[];
};

// Prefer a stored absolute url (admin-uploaded → Supabase Storage); otherwise
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

// Raw read straight from Supabase (no ISR cache). Falls back to the seed.
async function readProductsFromDb(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin().from("products").select("data");
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((r) => hydrate(r.data as RawProduct)).sort(byId);
    }
  } catch (e) {
    console.error("[products] Supabase read failed, using bundled seed:", (e as Error).message);
  }
  return (raw as unknown as RawProduct[]).map(hydrate).sort(byId);
}

const fetchAll = unstable_cache(readProductsFromDb, ["products:all"], { tags: ["products"], revalidate: 3600 });

/** Storefront read — cached (ISR), invalidated on admin save via revalidateTag("products"). */
export const getAllProducts = cache((): Promise<Product[]> => fetchAll());

/**
 * Uncached read straight from Supabase. Admin PAGES must use getAllProducts()
 * instead — mutations bump the "products" tag with {expire:0} so the cached
 * read is already immediate, and this full-collection read is expensive.
 * Reserved for rare one-shot API actions (Excel export, newsletter send).
 */
export const getAllProductsFresh = cache((): Promise<Product[]> => readProductsFromDb());

/** Storefront read — only active products visible to customers. */
export const getActiveProducts = cache(async (): Promise<Product[]> =>
  (await getAllProducts()).filter((p) => p.active !== false)
);

export const getCategories = cache(async (): Promise<string[]> =>
  Array.from(new Set((await getActiveProducts()).map((p) => p.category))).sort()
);

export const getNewIn = cache(async (): Promise<Product[]> =>
  (await getActiveProducts()).filter((p) => p.tag === "New").slice(0, 12)
);

export const getMostLoved = cache(async (): Promise<Product[]> =>
  [...(await getActiveProducts())].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 12)
);

export const getProduct = cache(async (slug: string): Promise<Product | undefined> => {
  // Normalize the incoming slug: lowercase, replace spaces/special chars with hyphens
  const normalized = slug.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const products = await getActiveProducts();
  // Try exact match first, then normalized match for backwards compatibility
  return (
    products.find((p) => p.slug === slug) ||
    products.find((p) => p.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === normalized)
  );
});

export const byCategory = cache(async (cat: string): Promise<Product[]> =>
  (await getActiveProducts()).filter((p) => p.category.toLowerCase() === cat.toLowerCase())
);
