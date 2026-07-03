import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/requireAdmin";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snap = await adminDb().collection("orders").orderBy("createdAt", "desc").limit(200).get();
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ orders });
}
