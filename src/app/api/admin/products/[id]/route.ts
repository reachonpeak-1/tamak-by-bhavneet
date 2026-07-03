import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { normalizeProduct } from "@/lib/admin/product-input";
import { logAudit } from "@/lib/audit";
import { bumpProducts } from "@/lib/revalidate";

export const runtime = "nodejs";

// PUT → full update of a product.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const ref = adminDb().collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const before = snap.data();
    const data = normalizeProduct(body);
    if (!data.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    await ref.set({ id, ...data, updatedAt: new Date().toISOString() }, { merge: true });
    await logAudit({ actor: admin.email ?? admin.uid, action: "product.update", target: { collection: "products", id }, before, after: data });
    bumpProducts();
    revalidatePath(`/product/${data.slug}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("product update error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE → remove a product.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const ref = adminDb().collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await ref.delete();
    await logAudit({ actor: admin.email ?? admin.uid, action: "product.delete", target: { collection: "products", id }, before: snap.data() });
    bumpProducts();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("product delete error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
