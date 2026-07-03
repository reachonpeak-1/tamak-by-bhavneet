"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="wrap page">
      <div className="empty">
        <span className="eyebrow">Something went wrong</span>
        <h2>A thread came loose</h2>
        <p>We hit an unexpected error. Please try again.</p>
        <div className="hero__cta" style={{ justifyContent: "center", marginTop: "1.2rem" }}>
          <button className="btn btn--solid" onClick={reset}>Try again</button>
          <Link className="btn btn--ghost" href="/">Home</Link>
        </div>
      </div>
    </main>
  );
}
