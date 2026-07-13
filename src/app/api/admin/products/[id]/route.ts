import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
    const sb = supabaseAdmin();
    const { data: row, error: readErr } = await sb
      .from("products")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const before = row.data as Record<string, unknown>;
    const data = normalizeProduct(body);
    if (!data.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Same semantics as Firestore's set(..., {merge:true}): top-level merge.
    const merged = { ...before, id, ...data, updatedAt: new Date().toISOString() };
    const { error: updateErr } = await sb.from("products").update({ data: merged }).eq("id", id);
    if (updateErr) throw updateErr;
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
    const sb = supabaseAdmin();
    const { data: row, error: readErr } = await sb
      .from("products")
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { error: delErr } = await sb.from("products").delete().eq("id", id);
    if (delErr) throw delErr;
    await logAudit({ actor: admin.email ?? admin.uid, action: "product.delete", target: { collection: "products", id }, before: row.data });
    bumpProducts();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("product delete error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
