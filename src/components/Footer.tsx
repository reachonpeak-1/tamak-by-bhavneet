"use client";

import Link from "next/link";
import { useState } from "react";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { Icon } from "@/lib/icon-registry";

type Data = typeof CONTENT_DEFAULTS.footer;
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export default function Footer({ data = CONTENT_DEFAULTS.footer }: { data?: Data }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (title: string) => {
    if (window.innerWidth > 900) return;
    setOpen((o) => ({ ...o, [title]: !o[title] }));
  };

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <span className="wm deva" style={{ fontSize: "1.8rem" }}>तमक</span>
            <p>{data.blurb}</p>
            <div className="socials">
              {data.socials.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}><Icon name={s.icon} /></a>
              ))}
            </div>
          </div>

          {data.cols.map((c) => (
            <div className={`foot-col${open[c.title] ? " open" : ""}`} key={c.title}>
              <h5 onClick={() => toggle(c.title)}>
                {c.title} <span className="acc-tog">+</span>
              </h5>
              <div className="acc-body" style={{ maxHeight: open[c.title] ? "600px" : undefined }}>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className={`foot-col${open["Help"] ? " open" : ""}`}>
            <h5 onClick={() => toggle("Help")}>
              Here to Help <span className="acc-tog">+</span>
            </h5>
            <div className="acc-body" style={{ maxHeight: open["Help"] ? "600px" : undefined }}>
              <div className="contact-li"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg><a href={`mailto:${data.email}`}>{data.email}</a></div>
              <div className="contact-li"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg><a href={telHref(data.phone)}>{data.phone}</a></div>
              <div className="contact-li"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg><span>{data.hoursNote}</span></div>
            </div>
          </div>
        </div>
        <div className="foot-bot">
          <span className="wm deva">तमक</span>
          <small>{data.bottomNote}</small>
          <small style={{ display: "flex", gap: ".9rem", flexWrap: "wrap" }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </small>
          <small>{data.payments}</small>
        </div>
      </div>
    </footer>
  );
}
