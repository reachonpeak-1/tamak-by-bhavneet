import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminStorage } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "_");

// POST multipart { file, prefix } → uploads to Storage at <root>/<prefix>/<name>
// and returns { path, url }. `path` is relative to the "products" root for
// product galleries (so it matches existing data) or "content/<section>".
// Bucket must be public-read (one-time IAM allUsers:objectViewer grant).
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!BUCKET) return NextResponse.json({ error: "Storage bucket not configured" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "").replace(/^\/+|\/+$/g, "");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Images only" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Max 8MB" }, { status: 400 });
  if (!prefix) return NextResponse.json({ error: "Missing prefix" }, { status: 400 });

  // unique-ish name without Math.random/Date in module scope concerns — fine here
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const name = `${safe(file.name.replace(/\.[^.]+$/, "")).slice(0, 40)}-${Date.now()}.${ext}`;
  // product galleries live under products/<id>/...; content under content/<section>/...
  const isContent = prefix.startsWith("content/");
  const key = isContent ? `${prefix}/${name}` : `products/${prefix}/${name}`;
  const relPath = isContent ? key : `${prefix}/${name}`; // what gets stored in the doc

  try {
    const buffer = Buffer.from(await file.arrayBuffer()); // stream from memory (Vercel FS is read-only)
    await adminStorage()
      .bucket()
      .file(key)
      .save(buffer, {
        contentType: file.type,
        metadata: { cacheControl: "public, max-age=31536000, immutable" },
      });
    const url = `https://storage.googleapis.com/${BUCKET}/${key}`;
    return NextResponse.json({ path: relPath, url });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
