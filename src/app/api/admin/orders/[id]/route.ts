import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { ORDER_STATUSES } from "@/lib/data/orders";

export const runtime = "nodejs";

const ALLOWED_STATUS: string[] = ORDER_STATUSES;

// PATCH { status?, tracking?, markPaid?, notes? } — update one order. Bearer admin only.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { status?: string; tracking?: string; markPaid?: boolean; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status) {
    if (!ALLOWED_STATUS.includes(body.status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });
    update.status = body.status;
  }
  if (typeof body.tracking === "string") update.tracking = body.tracking.trim();
  if (typeof body.notes === "string") update.notes = body.notes.slice(0, 5000);
  if (body.markPaid) update.paidAt = new Date().toISOString();
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  try {
    const sb = supabaseAdmin();
    const { data: row, error: readErr } = await sb.from("orders").select("data").eq("id", id).maybeSingle();
    if (readErr) throw readErr;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const before = row.data as Record<string, unknown>;

    const history = Array.isArray(before?.statusHistory) ? [...(before.statusHistory as unknown[])] : [];
    if (update.status) {
      history.push({ status: update.status, at: new Date().toISOString(), by: admin.email ?? admin.uid });
    }
    const merged = { ...before, ...update, statusHistory: history };
    const { error: updateErr } = await sb.from("orders").update({ data: merged }).eq("id", id);
    if (updateErr) throw updateErr;
    await logAudit({
      actor: admin.email ?? admin.uid,
      action: "order.update",
      target: { collection: "orders", id },
      before,
      after: update,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("order update error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
