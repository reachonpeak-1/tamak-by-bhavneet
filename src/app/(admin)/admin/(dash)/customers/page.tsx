import { getOrders } from "@/lib/data/orders";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Cust { name: string; email: string; phone: string; orders: number; spent: number; last: string }

export default async function CustomersPage() {
  const orders = await getOrders({ limit: 5000 });
  const map = new Map<string, Cust>();
  for (const o of orders) {
    const key = o.customer?.email || o.userId || o.id;
    if (!map.has(key)) {
      map.set(key, { name: o.customer?.name ?? "—", email: o.customer?.email ?? "—", phone: o.customer?.phone ?? "—", orders: 0, spent: 0, last: o.createdAt });
    }
    const c = map.get(key)!;
    c.orders += 1;
    if (o.status !== "cancelled" && o.status !== "refunded") c.spent += (o.amount || 0) / 100;
    if (o.createdAt > c.last) c.last = o.createdAt;
  }
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">People</span>
          <h1 className="adm-h">Customers</h1>
          <p className="adm-sub">{customers.length} customers · derived from orders</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="adm-card adm-muted">No customers yet.</div>
      ) : (
        <table className="adm-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i}>
                <td data-label="Name">{c.name}</td>
                <td data-label="Email">{c.email}</td>
                <td data-label="Phone">{c.phone}</td>
                <td data-label="Orders">{c.orders}</td>
                <td data-label="Total spent">₹{inr(Math.round(c.spent))}</td>
                <td data-label="Last order">{c.last.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
