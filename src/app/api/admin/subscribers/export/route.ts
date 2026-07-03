import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/firebase/requireAdminSession";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const snap = await adminDb().collection("subscribers").orderBy("createdAt", "desc").get();
  const rows = [["email", "source", "status", "createdAt"]];
  for (const d of snap.docs) {
    const s = d.data();
    rows.push([s.email ?? "", s.source ?? "", s.status ?? "active", s.createdAt ?? ""]);
  }
  const csv = rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
