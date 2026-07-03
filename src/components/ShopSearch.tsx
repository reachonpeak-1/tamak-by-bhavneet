"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ShopSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/shop${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form onSubmit={submit} className="shop-search" role="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input
        type="search"
        placeholder="Search sarees, kurtas, colours…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search products"
      />
      <button type="submit" className="btn btn--solid">Search</button>
    </form>
  );
}
