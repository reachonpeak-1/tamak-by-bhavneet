import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeProduct, slugify, nextProductId } from "@/lib/admin/product-input";
import { logAudit } from "@/lib/audit";
import { bumpProducts } from "@/lib/revalidate";

export const runtime = "nodejs";

// POST → create a new product, or duplicate one with { duplicateOf }.
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = await nextProductId();
  const now = new Date().toISOString();

  try {
    let data: Record<string, unknown>;
    if (body.duplicateOf) {
      const { data: src, error } = await supabaseAdmin()
        .from("products")
        .select("data")
        .eq("id", String(body.duplicateOf))
        .maybeSingle();
      if (error) throw error;
      if (!src) return NextResponse.json({ error: "Source not found" }, { status: 404 });
      const s = src.data as Record<string, unknown>;
      data = normalizeProduct({ ...s, name: `${s.name} (copy)`, slug: `${slugify(String(s.name))}-${id.toLowerCase()}` });
    } else {
      data = normalizeProduct(body);
      if (!data.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      if (!data.slug) (data as { slug: string }).slug = id.toLowerCase();
    }

    const { error: insertErr } = await supabaseAdmin()
      .from("products")
      .insert({ id, data: { id, ...data, createdAt: now, updatedAt: now } });
    if (insertErr) throw insertErr;
    await logAudit({ actor: admin.email ?? admin.uid, action: "product.create", target: { collection: "products", id }, after: data });
    bumpProducts();
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("product create error", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
