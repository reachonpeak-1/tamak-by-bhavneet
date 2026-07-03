// Server-only category data layer. Firestore `categories` is the SOURCE OF TRUTH
// for the homepage "Shop by category" rail and the product editor's category
// options. Each category's `name` is the canonical value stored on a product's
// `category` field, so creating a category keeps the rail, the product dropdown
// and shop filtering in sync.
//
// Storefront reads are cached with unstable_cache (tag "categories") and deduped
// per-render with React cache(). Admin mutations call bumpCategories() to refresh
// immediately (see src/lib/revalidate.ts).
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";

export interface Category {
  id: string; // slug, doc id
  name: string; // canonical — equals a product's `category`
  deva: string; // optional Devanagari label
  cnt: string; // optional caption
  image: string; // photo (required at create time)
  pos: string; // image object-position, e.g. "center top"
  panel: string; // decorative panel colour behind the photo
  tone: string; // motif tone
  motif: string; // motif key
  subs: string[]; // subcategory names (admin-managed; each equals a product's `subcategory`)
  order: number; // display order (ascending)
  createdAt: string;
}

/** Shop-link query for a category card: spaces become "+" (see shop/page.tsx). */
export const categoryQuery = (name: string) => name.trim().replace(/\s+/g, "+");

/** Shop-link query for a subcategory: spaces become "+" (see shop/page.tsx). */
export const subQuery = (name: string) => name.trim().replace(/\s+/g, "+");

const byOrder = (a: Category, b: Category) =>
  (a.order ?? 0) - (b.order ?? 0) || (a.createdAt < b.createdAt ? -1 : 1);

async function readCategoriesFromDb(): Promise<Category[]> {
  try {
    const snap = await adminDb().collection("categories").get();
    return snap.docs
      .map((d) => {
        const c = d.data() as Category;
        return { ...c, subs: Array.isArray(c.subs) ? c.subs : [] };
      })
      .sort(byOrder);
  } catch (e) {
    console.error("[categories] Firestore read failed:", (e as Error).message);
    return [];
  }
}

const fetchAll = unstable_cache(readCategoriesFromDb, ["categories:all"], {
  tags: ["categories"],
  revalidate: 3600,
});

/** Storefront read — cached (ISR), invalidated on admin save via bumpCategories(). */
export const listCategories = cache((): Promise<Category[]> => fetchAll());

/** Admin read — always fresh from Firestore so edits reflect immediately. */
export const listCategoriesFresh = cache((): Promise<Category[]> => readCategoriesFromDb());
