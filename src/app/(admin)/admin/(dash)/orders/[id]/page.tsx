import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrder, getOrders, isPaid } from "@/lib/data/orders";
import { getAllProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { getContent } from "@/lib/data/content";
import { inr } from "@/lib/format";
import OrderStatusControl from "@/components/admin/OrderStatusControl";
import OrderNotes from "@/components/admin/OrderNotes";
import CopyButton from "@/components/admin/CopyButton";
import PrintInvoiceButton from "@/components/admin/PrintInvoiceButton";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [o, settings, storeInfo, products, allOrders] = await Promise.all([
    getOrder(id),
    getSettings(),
    getContent("storeInfo"),
    getAllProducts(),
    getOrders({ limit: 1000 }),
  ]);
  if (!o) notFound();

  // Order lines store only {id, name, qty, ...} — the image lives on the product.
  const imageOf = new Map(products.map((p) => [p.id, p.image]));

  const email = o.customer?.email?.toLowerCase();
  const otherOrders = email
    ? allOrders.filter((x) => x.id !== o.id && x.customer?.email?.toLowerCase() === email)
    : [];

  const lines = o.lines ?? [];
  const total = (o.amount || 0) / 100;
  const paid = isPaid(o);
  const cod = o.method === "cod";
  const address = [o.customer?.address, o.customer?.city, o.customer?.pincode].filter(Boolean).join(", ");
  const fullAddress = [o.customer?.name, address, o.customer?.phone].filter(Boolean).join("\n");
  const placedOn = new Date(o.createdAt).toLocaleString("en-IN");

  return (
    <>
      <div className="adm-list-head no-print">
        <div>
          <span className="adm-eyebrow">Order #{o.id.slice(0, 7)}</span>
          <h1 className="adm-h">{o.customer?.name ?? "Order"}</h1>
          <p className="adm-sub">
            {placedOn} · <span className={`adm-pill adm-pill--${o.status}`}>{o.status.replace("_", " ")}</span>
          </p>
        </div>
        <div className="adm-actions">
          <PrintInvoiceButton />
          <Link className="adm-btn adm-btn--ghost" href="/admin/orders">← Back</Link>
        </div>
      </div>

      {o.needsRestock && o.needsRestock.length > 0 && (
        <div className="adm-card adm-warn-card no-print">
          <strong>Stock was not decremented for {o.needsRestock.length} item(s).</strong>{" "}
          <span className="adm-muted">
            This order was paid, but the stock update failed — inventory for{" "}
            {o.needsRestock.join(", ")} may be overstated. Adjust it manually under Products.
          </span>
        </div>
      )}

      <div className="adm-cards-2 no-print">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="adm-card">
            <span className="adm-eyebrow">Items</span>
            <h3 style={{ margin: ".2rem 0 1rem" }}>Line items</h3>
            <table className="adm-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>
                {lines.map((l, i) => {
                  const img = imageOf.get(l.id);
                  const variant = [l.size, l.color].filter(Boolean).join(" · ");
                  return (
                    <tr key={i}>
                      <td data-label="Product">
                        <span className="adm-line-item">
                          {img ? (
                            <Image src={img} alt="" width={44} height={56} className="adm-line-item__img" />
                          ) : (
                            <span className="adm-line-item__img adm-line-item__img--empty" aria-hidden />
                          )}
                          <span>
                            {l.name}
                            {variant && <><br /><span className="adm-muted" style={{ fontSize: ".8rem" }}>{variant}</span></>}
                          </span>
                        </span>
                      </td>
                      <td data-label="Qty">{l.qty}</td>
                      <td data-label="Unit">₹{inr(l.unitPrice)}</td>
                      <td data-label="Total">₹{inr(l.lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 pt-3 border-t border-line-2 text-[0.92rem]">
              <div className="flex justify-between py-1 gap-4"><span className="text-muted">Subtotal</span><span className="text-ink">₹{inr(o.subtotal ?? 0)}</span></div>
              <div className="flex justify-between py-1 gap-4">
                <span className="text-muted">Shipping</span>
                <span className="text-ink">{o.shipping ? `₹${inr(o.shipping)}` : "Free"}</span>
              </div>
              {!!o.tax && <div className="flex justify-between py-1 gap-4"><span className="text-muted">Tax</span><span className="text-ink">₹{inr(o.tax)}</span></div>}
              {!!o.discount && (
                <div className="flex justify-between py-1 gap-4"><span className="text-muted">Discount {o.coupon ? `(${o.coupon})` : ""}</span><span className="text-ink">−₹{inr(o.discount)}</span></div>
              )}
              <div className="flex justify-between mt-2 pt-2 border-t border-line-2 font-serif text-[1.22rem] text-ink"><span className="text-ink">Total</span><span>₹{inr(total)}</span></div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <OrderStatusControl
            id={o.id}
            status={o.status}
            tracking={o.tracking}
            isCod={cod}
            paidAt={o.paidAt}
          />

          <div className="adm-card">
            <span className="adm-eyebrow">Payment</span>
            <h3 style={{ margin: ".2rem 0 .8rem" }}>
              {cod ? "Cash on delivery" : "Online (Razorpay)"}{" "}
              <span className={`adm-pill adm-pill--${paid ? "paid" : "pending"}`}>{paid ? "paid" : "unpaid"}</span>
            </h3>
            <dl className="adm-kv">
              <div><dt>Amount</dt><dd>₹{inr(total)} {o.currency ?? "INR"}</dd></div>
              {o.paidAt && <div><dt>Paid at</dt><dd>{new Date(o.paidAt).toLocaleString("en-IN")}</dd></div>}
              {o.paymentId && (
                <div>
                  <dt>Payment id</dt>
                  <dd><code>{o.paymentId}</code> <CopyButton value={o.paymentId} label="Payment id" /></dd>
                </div>
              )}
              {o.orderId && (
                <div>
                  <dt>Razorpay order</dt>
                  <dd><code>{o.orderId}</code> <CopyButton value={o.orderId} label="Razorpay order id" /></dd>
                </div>
              )}
              <div><dt>Customer</dt><dd>{o.userId ? "Signed in" : "Guest checkout"}</dd></div>
            </dl>
          </div>

          <div className="adm-card">
            <span className="adm-eyebrow">Customer</span>
            <h3 style={{ margin: ".2rem 0 .8rem" }}>Shipping</h3>
            <dl className="adm-kv">
              <div><dt>Name</dt><dd>{o.customer?.name ?? "—"}</dd></div>
              {o.customer?.phone && (
                <div><dt>Phone</dt><dd>{o.customer.phone} <CopyButton value={o.customer.phone} label="Phone" /></dd></div>
              )}
              {o.customer?.email && (
                <div><dt>Email</dt><dd>{o.customer.email} <CopyButton value={o.customer.email} label="Email" /></dd></div>
              )}
              {address && (
                <div><dt>Address</dt><dd>{address} <CopyButton value={fullAddress} label="Address" /></dd></div>
              )}
            </dl>
            {o.tracking && <p className="adm-ok" style={{ marginTop: ".6rem" }}>Tracking: {o.tracking}</p>}
            {otherOrders.length > 0 && email && (
              <p style={{ marginTop: ".8rem", fontSize: ".88rem" }}>
                <Link href={`/admin/orders?q=${encodeURIComponent(email)}`}>
                  {otherOrders.length} other order{otherOrders.length === 1 ? "" : "s"} from this customer →
                </Link>
              </p>
            )}
          </div>

          <OrderNotes id={o.id} notes={o.notes} />

          {o.statusHistory && o.statusHistory.length > 0 && (
            <div className="adm-card">
              <span className="adm-eyebrow">Timeline</span>
              <h3 style={{ margin: ".2rem 0 .8rem" }}>History</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: ".88rem" }}>
                {o.statusHistory.map((h, i) => (
                  <li key={i} style={{ padding: ".3rem 0", borderBottom: "1px solid var(--line-2)" }}>
                    <span className={`adm-pill adm-pill--${h.status}`}>{h.status.replace("_", " ")}</span>{" "}
                    <span className="adm-muted">{new Date(h.at).toLocaleString("en-IN")}</span>
                    {h.by && <span className="adm-muted"> · {h.by}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Print-only invoice — hidden on screen, the sole thing @media print shows. */}
      <div className="invoice" aria-hidden>
        <header className="invoice__head">
          <div>
            <Image src="/brand/logo.png" alt="" width={48} height={48} className="invoice__logo" />
            <h2 className="invoice__store">{settings.storeName}</h2>
            <p className="invoice__from">
              {storeInfo.address.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}
              {settings.phone} · {settings.email}
            </p>
          </div>
          <div className="invoice__meta">
            <h1>Invoice</h1>
            <p>
              <strong>#{o.id.slice(0, 7)}</strong><br />
              {placedOn}
            </p>
          </div>
        </header>

        <section className="invoice__bill">
          <h3>Bill to</h3>
          <p>
            {o.customer?.name}<br />
            {address}<br />
            {o.customer?.email}{o.customer?.phone ? ` · ${o.customer.phone}` : ""}
          </p>
        </section>

        <table className="invoice__table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const variant = [l.size, l.color].filter(Boolean).join(" · ");
              return (
                <tr key={i}>
                  <td>{l.name}{variant ? ` (${variant})` : ""}</td>
                  <td>{l.qty}</td>
                  <td>₹{inr(l.unitPrice)}</td>
                  <td>₹{inr(l.lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Subtotal</td><td>₹{inr(o.subtotal ?? 0)}</td></tr>
            <tr><td colSpan={3}>Shipping</td><td>{o.shipping ? `₹${inr(o.shipping)}` : "Free"}</td></tr>
            {!!o.tax && <tr><td colSpan={3}>Tax</td><td>₹{inr(o.tax)}</td></tr>}
            {!!o.discount && (
              <tr><td colSpan={3}>Discount {o.coupon ? `(${o.coupon})` : ""}</td><td>−₹{inr(o.discount)}</td></tr>
            )}
            <tr className="invoice__grand"><td colSpan={3}>Total</td><td>₹{inr(total)}</td></tr>
          </tfoot>
        </table>

        <footer className="invoice__foot">
          <p>
            <strong>Payment:</strong> {cod ? "Cash on delivery" : "Razorpay"}
            {o.paymentId ? ` · ${o.paymentId}` : ""} · {paid ? "PAID" : "UNPAID"}
          </p>
          <p className="invoice__thanks">Thank you for shopping with {settings.storeName}.</p>
        </footer>
      </div>
    </>
  );
}
