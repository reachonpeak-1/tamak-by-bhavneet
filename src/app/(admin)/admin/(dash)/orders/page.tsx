import Link from "next/link";
import { getOrders } from "@/lib/data/orders";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUSES = ["cod_pending", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "paid"];
const within = (iso: string, from?: string, to?: string) =>
  (!from || iso.slice(0, 10) >= from) && (!to || iso.slice(0, 10) <= to);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  const { status, q, from, to } = await searchParams;
  let orders = await getOrders({ limit: 1000 });
  if (status) orders = orders.filter((o) => o.status === status);
  if (from || to) orders = orders.filter((o) => within(o.createdAt, from, to));
  if (q) {
    const t = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.id.toLowerCase().includes(t) ||
        (o.customer?.name ?? "").toLowerCase().includes(t) ||
        (o.customer?.email ?? "").toLowerCase().includes(t)
    );
  }

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Fulfilment</span>
          <h1 className="adm-h">Orders</h1>
          <p className="adm-sub">{orders.length} shown</p>
        </div>
        <a className="adm-btn adm-btn--gold" href="/api/admin/orders/export">Export CSV</a>
      </div>

      <form className="adm-row" method="get" style={{ marginBottom: "1.2rem", alignItems: "flex-end" }}>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Status</span>
          <select name="status" className="adm-select" defaultValue={status ?? ""}>
            <option value="">All</option>
            {STATUSES.map((x) => <option key={x} value={x}>{x.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Search</span>
          <input name="q" className="adm-in" placeholder="Name, email or id" defaultValue={q ?? ""} />
        </label>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>From</span>
          <input name="from" type="date" className="adm-in" defaultValue={from ?? ""} />
        </label>
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>To</span>
          <input name="to" type="date" className="adm-in" defaultValue={to ?? ""} />
        </label>
        <button className="adm-btn adm-btn--ghost">Filter</button>
      </form>

      {orders.length === 0 ? (
        <div className="adm-card adm-muted">No orders match.</div>
      ) : (
        <>
          <table className="adm-table desktop-only">
            <thead>
              <tr>
                <th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Method</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Order"><Link href={`/admin/orders/${o.id}`}>#{o.id.slice(0, 7)}</Link></td>
                  <td data-label="Date">{o.createdAt.slice(0, 10)}</td>
                  <td data-label="Customer">{o.customer?.name ?? "—"}</td>
                  <td data-label="Items">{(o.lines ?? []).reduce((s, l) => s + l.qty, 0)}</td>
                  <td data-label="Total">₹{inr((o.amount || 0) / 100)}</td>
                  <td data-label="Method">{o.method === "cod" ? "COD" : "Online"}</td>
                  <td data-label="Status"><span className={`adm-pill adm-pill--${o.status}`}>{o.status.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card Layout */}
          <div className="adm-orders-mobile-list mobile-only">
            {orders.map((o) => (
              <div key={o.id} className="adm-order-card-mobile">
                <div className="adm-order-card-mobile__header">
                  <Link href={`/admin/orders/${o.id}`} className="adm-order-card-mobile__id">
                    #{o.id.slice(0, 7)}
                  </Link>
                  <span className={`adm-pill adm-pill--${o.status}`}>
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                
                <div className="adm-order-card-mobile__body">
                  <div className="adm-order-card-mobile__customer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.4rem", color: "var(--muted)" }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {o.customer?.name ?? "Guest Customer"}
                  </div>
                  <div className="adm-order-card-mobile__meta">
                    <span>{o.createdAt.slice(0, 10)}</span>
                    <span className="adm-order-card-mobile__divider">·</span>
                    <span>{(o.lines ?? []).reduce((s, l) => s + l.qty, 0)} items</span>
                    <span className="adm-order-card-mobile__divider">·</span>
                    <span>{o.method === "cod" ? "COD" : "Online"}</span>
                  </div>
                </div>
                
                <div className="adm-order-card-mobile__footer">
                  <span className="adm-order-card-mobile__amount">
                    ₹{inr((o.amount || 0) / 100)}
                  </span>
                  <Link href={`/admin/orders/${o.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
