import { Suspense } from "react";
import { getOrders, isPaid, type Order } from "@/lib/data/orders";
import { getAllProducts } from "@/lib/data/products";
import { inr } from "@/lib/format";
import StatCard from "@/components/admin/StatCard";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import LineChart from "@/components/admin/charts/LineChart";
import BarChart from "@/components/admin/charts/BarChart";

export const dynamic = "force-dynamic";

const dayKey = (iso: string) => iso.slice(0, 10);
const within = (iso: string, from?: string, to?: string) =>
  (!from || iso.slice(0, 10) >= from) && (!to || iso.slice(0, 10) <= to);

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const [allOrders, products] = await Promise.all([getOrders({ limit: 1000 }), getAllProducts()]);
  const orders = allOrders.filter((o) => within(o.createdAt, from, to));

  const live = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const revenuePaise = live.reduce((s, o) => s + (o.amount || 0), 0);
  const revenue = revenuePaise / 100;
  const count = live.length;
  const aov = count ? revenue / count : 0;

  const paidCount = live.filter(isPaid).length;

  // revenue over time (by day, chronological)
  const byDay = new Map<string, number>();
  for (const o of live) byDay.set(dayKey(o.createdAt), (byDay.get(dayKey(o.createdAt)) || 0) + o.amount / 100);
  const series = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, v]) => ({ label: d.slice(5), value: Math.round(v) }));

  // top products by quantity
  const qtyByProduct = new Map<string, number>();
  for (const o of live) for (const l of o.lines ?? []) qtyByProduct.set(l.name, (qtyByProduct.get(l.name) || 0) + l.qty);
  const topProducts = [...qtyByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, sub: `${value} sold` }));

  const lowStock = products.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock).slice(0, 8);

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Overview</span>
          <h1 className="adm-h">Dashboard</h1>
          <p className="adm-sub">{from || to ? "Filtered range" : "All time"} · {orders.length} orders</p>
        </div>
        <Suspense>
          <DateRangeFilter />
        </Suspense>
      </div>

      <div className="adm-grid adm-grid--stats" style={{ marginBottom: "1rem" }}>
        <StatCard label="Revenue" value={`₹${inr(Math.round(revenue))}`} sub={`${paidCount} paid`} />
        <StatCard label="Orders" value={String(count)} />
        <StatCard label="Avg order value" value={`₹${inr(Math.round(aov))}`} />
      </div>

      <div className="adm-card" style={{ marginBottom: "1rem" }}>
        <span className="adm-eyebrow">Revenue over time</span>
        <h3 style={{ margin: ".2rem 0 1rem" }}>Daily (₹)</h3>
        <LineChart data={series} />
      </div>

      <div className="adm-cards-2">
        <div className="adm-card">
          <span className="adm-eyebrow">Bestsellers</span>
          <h3 style={{ margin: ".2rem 0 1rem" }}>Top products</h3>
          <BarChart data={topProducts} />
        </div>
        <div className="adm-card">
          <span className="adm-eyebrow">Inventory</span>
          <h3 style={{ margin: ".2rem 0 1rem" }}>Low stock</h3>
          {lowStock.length === 0 ? (
            <p className="adm-muted">All products well stocked.</p>
          ) : (
            <table className="adm-table">
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Product"><a href={`/admin/products/${p.id}`}>{p.name}</a></td>
                    <td data-label="Stock" style={{ textAlign: "right" }}>
                      <span className="adm-pill adm-pill--low">{p.stock} left</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
