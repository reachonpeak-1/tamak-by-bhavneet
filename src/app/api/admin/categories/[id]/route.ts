import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { logAudit } from "@/lib/audit";
import { bumpCategories } from "@/lib/revalidate";

export const runtime = "nodejs";

const str = (v: unknown) => String(v ?? "").trim();
const subsOf = (v: unknown): string[] =>
  Array.isArray(v) ? Array.from(new Set(v.map((x) => String(x).trim()).filter(Boolean))) : [];

// PUT → update mutable fields (the name/slug id is immutable). DELETE → remove.
// Deleting a category does NOT touch products; their stored `category` string is
// left as-is so historical data and shop filtering keep working.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!str(b.name) || !str(b.image)) return NextResponse.json({ error: "Name and photo are required" }, { status: 400 });
  const update = {
    name: str(b.name),
    deva: str(b.deva),
    cnt: str(b.cnt),
    image: str(b.image),
    pos: str(b.pos) || "center top",
    panel: str(b.panel) || "p-indigo",
    tone: str(b.tone) || "m-gold",
    motif: str(b.motif) || "paisley",
    subs: subsOf(b.subs),
    order: Math.max(0, Math.floor(Number(b.order) || 0)),
  };
  try {
    const ref = adminDb().collection("categories").doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await ref.set(update, { merge: true });
    await logAudit({ actor: admin.email ?? admin.uid, action: "category.update", target: { collection: "categories", id }, after: update });
    bumpCategories();
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("category update error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await adminDb().collection("categories").doc(id).delete();
    await logAudit({ actor: admin.email ?? admin.uid, action: "category.delete", target: { collection: "categories", id } });
    bumpCategories();
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("category delete error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
