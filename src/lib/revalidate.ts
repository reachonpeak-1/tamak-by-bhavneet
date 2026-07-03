import "server-only";
import { revalidateTag } from "next/cache";

// Two-arg revalidateTag is required in Next 16; { expire: 0 } forces immediate
// expiry (correct for admin route handlers that need the change live now).
export function bumpProducts() {
  revalidateTag("products", { expire: 0 });
}

export function bumpContent(section?: string) {
  revalidateTag("content", { expire: 0 });
  if (section) revalidateTag(`content:${section}`, { expire: 0 });
}

export function bumpSettings() {
  revalidateTag("settings", { expire: 0 });
}

export function bumpCategories() {
  revalidateTag("categories", { expire: 0 });
}
