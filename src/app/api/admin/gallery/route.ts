import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// GET ?prefix=&limit=&pageToken= → lists images already in Firebase Storage so the
// admin can browse/reuse them. Cursor-paginated via the Storage API's pageToken.
// Default prefix is "" → the ENTIRE bucket (every photo), not just products/.
// Product image paths are stored in docs WITHOUT the "products/" root (the upload
// route + hydrateGallery re-add it), so we strip that prefix here to return paths
// that can be dropped straight into a product's gallery.
const IMG_RE = /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i;

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!BUCKET) return NextResponse.json({ error: "Storage bucket not configured" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const prefix = (searchParams.get("prefix") ?? "").replace(/^\/+/, "");
  const pageToken = searchParams.get("pageToken") || undefined;
  const limit = Math.min(120, Math.max(1, Number(searchParams.get("limit")) || 60));

  try {
    const [files, nextQuery] = await adminStorage()
      .bucket()
      .getFiles({ prefix, maxResults: limit, pageToken, autoPaginate: false });

    const images = files
      // keep only real image objects: not a folder placeholder, non-empty, and
      // either an image content-type or an image file extension.
      .filter((f) => {
        if (f.name.endsWith("/") || Number(f.metadata?.size ?? 0) === 0) return false;
        const ct = String(f.metadata?.contentType ?? "");
        return ct.startsWith("image/") || IMG_RE.test(f.name);
      })
      .map((f) => {
        const name = f.name;
        const isProduct = name.startsWith("products/");
        return {
          // what gets stored on the product doc (products/ root stripped)
          path: isProduct ? name.slice("products/".length) : name,
          // full storage key + delivery url
          name,
          url: `https://storage.googleapis.com/${BUCKET}/${name}`,
          size: Number(f.metadata?.size ?? 0),
          updated: f.metadata?.updated ?? null,
        };
      });

    const nextPageToken = (nextQuery as { pageToken?: string } | undefined)?.pageToken ?? null;
    return NextResponse.json({ images, nextPageToken });
  } catch (e) {
    console.error("gallery list error", e);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}
