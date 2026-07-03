"use client";

import { useState } from "react";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

type Data = typeof CONTENT_DEFAULTS.newsletter;

export default function Newsletter({ data = CONTENT_DEFAULTS.newsletter }: { data?: Data }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMsg("Please enter a valid email address.");
      return;
    }
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "newsletter" }),
      });
    } catch {
      /* non-blocking */
    }
    setMsg(data.success);
    setEmail("");
  };

  return (
    <section className="news section">
      <div className="wrap">
        <div className="news__in reveal">
          <span className="eyebrow">{data.eyebrow}</span>
          <h2>{data.title}</h2>
          <p>{data.sub}</p>
          <form onSubmit={submit} noValidate>
            <input
              type="email"
              placeholder={data.placeholder}
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">{data.button}</button>
          </form>
          <div className="msg" role="status">{msg}</div>
        </div>
      </div>
    </section>
  );
}
