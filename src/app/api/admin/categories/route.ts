import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { logAudit } from "@/lib/audit";
import { bumpCategories } from "@/lib/revalidate";
import { slugify } from "@/lib/admin/product-input";
import type { Category } from "@/lib/data/categories";

export const runtime = "nodejs";

const str = (v: unknown) => String(v ?? "").trim();
const subsOf = (v: unknown): string[] =>
  Array.isArray(v) ? Array.from(new Set(v.map((x) => String(x).trim()).filter(Boolean))) : [];

function normalize(b: Record<string, unknown>): Category | null {
  const name = str(b.name);
  const image = str(b.image);
  if (!name || !image) return null; // name + photo are required
  return {
    id: slugify(name),
    name,
    deva: str(b.deva),
    cnt: str(b.cnt),
    image,
    pos: str(b.pos) || "center top",
    panel: str(b.panel) || "p-indigo",
    tone: str(b.tone) || "m-gold",
    motif: str(b.motif) || "paisley",
    subs: subsOf(b.subs),
    order: Math.max(0, Math.floor(Number(b.order) || 0)),
    createdAt: str(b.createdAt) || new Date().toISOString(),
  };
}

// GET list / POST create.
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await adminDb().collection("categories").get();
  return NextResponse.json({ categories: snap.docs.map((d) => d.data()) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const c = normalize(body);
  if (!c) return NextResponse.json({ error: "Name and photo are required" }, { status: 400 });
  try {
    const col = adminDb().collection("categories");
    const ref = col.doc(c.id);
    if ((await ref.get()).exists) return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
    // append to the end if no explicit order was provided
    if (!body.order) c.order = (await col.get()).size;
    await ref.set(c);
    await logAudit({ actor: admin.email ?? admin.uid, action: "category.create", target: { collection: "categories", id: c.id }, after: c });
    bumpCategories();
    revalidatePath("/");
    return NextResponse.json({ ok: true, id: c.id });
  } catch (e) {
    console.error("category create error", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
