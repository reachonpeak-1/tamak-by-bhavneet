import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/orders";
import { inr } from "@/lib/format";
import OrderStatusControl from "@/components/admin/OrderStatusControl";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Order #{o.id.slice(0, 7)}</span>
          <h1 className="adm-h">{o.customer?.name ?? "Order"}</h1>
          <p className="adm-sub">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <Link className="adm-btn adm-btn--ghost" href="/admin/orders">← Back</Link>
      </div>

      <div className="adm-cards-2">
        <div className="adm-card">
          <span className="adm-eyebrow">Items</span>
          <h3 style={{ margin: ".2rem 0 1rem" }}>Line items</h3>
          <table className="adm-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
            <tbody>
              {(o.lines ?? []).map((l, i) => (
                <tr key={i}>
                  <td data-label="Product">{l.name}</td>
                  <td data-label="Qty">{l.qty}</td>
                  <td data-label="Unit">₹{inr(l.unitPrice)}</td>
                  <td data-label="Total">₹{inr(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            {typeof o.discount === "number" && o.discount > 0 && (
              <p className="adm-muted">Discount {o.coupon ? `(${o.coupon})` : ""}: −₹{inr(o.discount)}</p>
            )}
            <p style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>Total: ₹{inr((o.amount || 0) / 100)}</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <OrderStatusControl
            id={o.id}
            status={o.status}
            tracking={o.tracking}
            isCod={o.method === "cod"}
            paidAt={o.paidAt}
          />
          <div className="adm-card">
            <span className="adm-eyebrow">Customer</span>
            <h3 style={{ margin: ".2rem 0 .8rem" }}>Shipping</h3>
            <p style={{ lineHeight: 1.7, fontSize: ".92rem" }}>
              {o.customer?.name}<br />
              {o.customer?.phone}<br />
              {o.customer?.email}<br />
              {o.customer?.address}, {o.customer?.city} {o.customer?.pincode}
            </p>
            {o.tracking && <p className="adm-ok" style={{ marginTop: ".6rem" }}>Tracking: {o.tracking}</p>}
          </div>
          {o.statusHistory && o.statusHistory.length > 0 && (
            <div className="adm-card">
              <span className="adm-eyebrow">Timeline</span>
              <h3 style={{ margin: ".2rem 0 .8rem" }}>History</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".88rem" }}>
                {o.statusHistory.map((h, i) => (
                  <li key={i} style={{ padding: ".3rem 0", borderBottom: "1px solid var(--line-2)" }}>
                    <span className={`adm-pill adm-pill--${h.status}`}>{h.status.replace("_", " ")}</span>{" "}
                    <span className="adm-muted">{new Date(h.at).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
