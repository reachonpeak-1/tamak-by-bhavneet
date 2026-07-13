import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/requireAdminSession";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { data } = await supabaseAdmin()
    .from("subscribers")
    .select("data")
    .order("created_at", { ascending: false });
  const rows = [["email", "source", "status", "createdAt"]];
  for (const r of data ?? []) {
    const s = r.data as { email?: string; source?: string; status?: string; createdAt?: string };
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
