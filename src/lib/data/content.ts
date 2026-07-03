import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { CONTENT_DEFAULTS, type ContentSection } from "@/lib/content-defaults";

// Merges a stored doc over the defaults. Top-level keys from the stored doc win,
// but object-valued keys (e.g. nested settings) are merged key-by-key so that
// newly-added default keys survive a doc seeded before those keys existed.
// Arrays (editable lists like categoryRail.cats) are replaced wholesale — the
// rendering components fill any per-item gaps from CONTENT_DEFAULTS.
function mergeSection<T>(def: T, stored: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...(def as object) };
  for (const [k, v] of Object.entries(stored)) {
    const dv = (def as Record<string, unknown>)[k];
    const bothPlainObjects =
      v && typeof v === "object" && !Array.isArray(v) &&
      dv && typeof dv === "object" && !Array.isArray(dv);
    out[k] = bothPlainObjects ? { ...(dv as object), ...(v as object) } : v;
  }
  return out as T;
}

// Reads content/{section} from Firestore (cached, tag "content"+"content:<s>").
// Falls back to the bundled defaults so the storefront never breaks pre-seed.
function fetcher(section: ContentSection) {
  return unstable_cache(
    async () => {
      try {
        const doc = await adminDb().collection("content").doc(section).get();
        if (doc.exists) return mergeSection(CONTENT_DEFAULTS[section], doc.data() as Record<string, unknown>);
      } catch (e) {
        console.error(`[content:${section}] read failed, using defaults:`, (e as Error).message);
      }
      return CONTENT_DEFAULTS[section];
    },
    ["content", section],
    { tags: ["content", `content:${section}`], revalidate: 3600 }
  );
}

export const getContent = cache(<S extends ContentSection>(section: S): Promise<(typeof CONTENT_DEFAULTS)[S]> => {
  return fetcher(section)() as Promise<(typeof CONTENT_DEFAULTS)[S]>;
});
