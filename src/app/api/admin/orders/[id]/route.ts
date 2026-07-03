import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const ALLOWED_STATUS = [
  "cod_pending", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "paid",
];

// PATCH { status?, tracking?, markPaid? } — update one order. Bearer admin only.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { status?: string; tracking?: string; markPaid?: boolean };
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
  if (body.markPaid) update.paidAt = new Date().toISOString();
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  try {
    const ref = adminDb().collection("orders").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const before = snap.data();

    const history = Array.isArray(before?.statusHistory) ? [...before!.statusHistory] : [];
    if (update.status) {
      history.push({ status: update.status, at: new Date().toISOString(), by: admin.email ?? admin.uid });
    }
    await ref.set({ ...update, statusHistory: history }, { merge: true });
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
