import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

// Reads the content row for a section (cached, tag "content"+"content:<s>").
async function readContentFromDb(section: ContentSection) {
  const { data, error } = await supabaseAdmin()
    .from("content")
    .select("data")
    .eq("id", section)
    .maybeSingle();
  if (error) throw error;
  if (data) return mergeSection(CONTENT_DEFAULTS[section], data.data as Record<string, unknown>);
  return CONTENT_DEFAULTS[section];
}

// NOT wrapped in try/catch here: unstable_cache only caches resolved values, so a thrown
// error is never cached — a transient/config failure self-heals on the very next request
// instead of being stuck behind the 3600s revalidate window. getContent() below catches it.
function fetcher(section: ContentSection) {
  return unstable_cache(() => readContentFromDb(section), ["content", section], {
    tags: ["content", `content:${section}`],
    revalidate: 3600,
  });
}

// Falls back to the bundled defaults so the storefront never breaks pre-seed.
export const getContent = cache(async <S extends ContentSection>(section: S): Promise<(typeof CONTENT_DEFAULTS)[S]> => {
  try {
    return (await fetcher(section)()) as (typeof CONTENT_DEFAULTS)[S];
  } catch (e) {
    console.error(`[content:${section}] read failed, using defaults:`, (e as Error).message);
    return CONTENT_DEFAULTS[section];
  }
});
