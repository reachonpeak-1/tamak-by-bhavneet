"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { inr } from "@/lib/format";

interface OrderDoc {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  lines?: { name: string; qty: number }[];
}

export default function AccountPage() {
  const { user, loading, configured, signInGoogle, signInEmail, signUpEmail, signOut, getToken } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/me/orders", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setOrders(data.orders);
      } catch {}
    })();
  }, [user, getToken]);

  if (!configured) {
    return (
      <main className="wrap page">
        <div className="empty">
          <h2>Accounts coming online soon</h2>
          <p>Login is enabled once Supabase is connected. You can still shop and check out as a guest.</p>
          <Link className="btn btn--solid" href="/shop">Continue shopping</Link>
        </div>
      </main>
    );
  }

  if (loading) return <main className="wrap page"><p className="count-note">Loading…</p></main>;

  if (user) {
    const creationTime = (user as any).metadata?.creationTime;
    const memberSince = creationTime
      ? new Date(creationTime).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      : "";
    const initials = user.displayName
      ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase()
      : (user.email ? user.email[0].toUpperCase() : "U");

    return (
      <main className="wrap page account-dashboard">
        <div className="dashboard-grid">
          {/* Profile Card (Left Column) */}
          <aside className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </div>
              <h2 className="profile-name">{user.displayName || "Customer"}</h2>
              <p className="profile-email">{user.email}</p>
              {memberSince && <p className="profile-meta">Member since {memberSince}</p>}
              
              <div className="profile-actions">
                <button className="btn btn--ghost signout-btn" onClick={() => signOut()}>
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          {/* Orders Section (Right Column) */}
          <section className="orders-section">
            <div className="orders-header">
              <h2 className="orders-title">Order History</h2>
              {orders && <span className="orders-count">{orders.length} orders</span>}
            </div>

            <div className="orders-container">
              {orders === null ? (
                <div className="order-loader">
                  <div className="spinner"></div>
                  <p>Fetching your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="orders-empty">
                  <svg viewBox="0 0 24 24" className="empty-icon"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
                  <h3>No orders yet</h3>
                  <p>Explore our latest collection and find your perfect fit.</p>
                  <Link href="/shop" className="btn btn--solid">Shop Now</Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((o) => {
                    const statusClass = `status--${o.status.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                      <div className="order-card" key={o.id}>
                        <div className="order-card__header">
                          <div>
                            <span className="order-number">Order #{o.id.substring(0, 8)}</span>
                            <span className="order-date">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                          <span className={`order-status ${statusClass}`}>{o.status}</span>
                        </div>
                        <div className="order-card__body">
                          <ul className="order-items">
                            {o.lines?.map((l, idx) => (
                              <li key={idx} className="order-item">
                                <span className="item-name">{l.name}</span>
                                <span className="item-qty">Qty: {l.qty}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="order-card__footer">
                          <span className="footer-label">Total Amount</span>
                          <span className="footer-price">₹{inr(Math.round(o.amount / 100))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "in") await signInEmail(email, pw);
      else await signUpEmail(email, pw);
    } catch (e) {
      setErr((e as Error).message.trim());
    }
  };

  return (
    <main className="wrap page" style={{ maxWidth: 480 }}>
      <div className="login-card">
        <div className="page-head" style={{ marginBottom: "1.5rem" }}>
          <span className="eyebrow">Account</span>
          <h1 style={{ fontSize: "2rem" }}>{mode === "in" ? "Sign in" : "Create account"}</h1>
        </div>
        <button className="btn btn--ghost" style={{ width: "100%", justifyContent: "center", marginBottom: "1.1rem" }} onClick={() => signInGoogle("/account").catch((e) => setErr(e.message))}>
          Continue with Google
        </button>
        <div className="count-note" style={{ textAlign: "center", margin: "0.8rem 0" }}>or</div>
        <form onSubmit={submit} style={{ display: "grid", gap: ".8rem" }}>
          <input className="co-in" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="co-in" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          {err && <p className="sm" style={{ color: "#b03a3a", margin: "0 0 0.5rem" }}>{err}</p>}
          <button className="btn btn--solid" style={{ justifyContent: "center" }} type="submit">
            {mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button className="link-back" style={{ marginTop: "1.5rem", display: "inline-block" }} onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
