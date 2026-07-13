import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { bumpSettings } from "@/lib/revalidate";
import { SETTINGS_DEFAULTS, type Settings } from "@/lib/data/settings";

export const runtime = "nodejs";

function normalize(b: Record<string, unknown>): Settings {
  return {
    storeName: String(b.storeName ?? SETTINGS_DEFAULTS.storeName).trim(),
    email: String(b.email ?? "").trim(),
    phone: String(b.phone ?? "").trim(),
    whatsapp: String(b.whatsapp ?? "").trim(),
    razorpayMode: b.razorpayMode === "live" ? "live" : "test",
    freeShipThreshold: Math.max(0, Number(b.freeShipThreshold) || 0),
    flatShipping: Math.max(0, Number(b.flatShipping) || 0),
    taxPercent: Math.max(0, Number(b.taxPercent) || 0),
    returnsText: String(b.returnsText ?? "").trim(),
  };
}

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const data = normalize(body);
    const sb = supabaseAdmin();
    const { data: prev } = await sb.from("settings").select("data").eq("id", "store").maybeSingle();
    const before = prev?.data ?? null;
    const { error } = await sb
      .from("settings")
      .upsert({ id: "store", data: { ...data, updatedAt: new Date().toISOString() } });
    if (error) throw error;
    await logAudit({ actor: admin.email ?? admin.uid, action: "settings.save", target: { collection: "settings", id: "store" }, before, after: data });
    bumpSettings();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings save error", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
