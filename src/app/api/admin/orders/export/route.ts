import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/firebase/requireAdminSession";
import { getOrders } from "@/lib/data/orders";

export const runtime = "nodejs";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// GET → orders.csv. Cookie-authed so a plain <a href> download works.
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const orders = await getOrders({ limit: 5000 });
  const header = ["id", "createdAt", "status", "method", "amount_inr", "customer", "email", "phone", "city", "items"];
  const rows = orders.map((o) => [
    o.id,
    o.createdAt,
    o.status,
    o.method ?? "online",
    (o.amount || 0) / 100,
    o.customer?.name ?? "",
    o.customer?.email ?? "",
    o.customer?.phone ?? "",
    o.customer?.city ?? "",
    (o.lines ?? []).map((l) => `${l.name} x${l.qty}`).join("; "),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
