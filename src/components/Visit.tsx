"use client";

import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { useState, useEffect } from "react";

type Data = typeof CONTENT_DEFAULTS.storeInfo;
const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, "")}`;

export default function Visit({ data = CONTENT_DEFAULTS.storeInfo }: { data?: Data }) {
  const [loadMap, setLoadMap] = useState(false);
  
  useEffect(() => {
    // Load map automatically after 3.5s to not block initial page load
    const t = setTimeout(() => setLoadMap(true), 3500);
    return () => clearTimeout(t);
  }, []);

  const embedUrl = "https://maps.google.com/maps?q=30.179151,74.939499&hl=en&z=15&output=embed";
  const displayAddress = "SCO - 40, Dabwali Rd, Ganpati Enclave,\nBathinda, Punjab 151001";

  return (
    <section className="visit section" id="visit">
      <div className="wrap">
        <div className="grid">
          <div className="reveal">
            <span className="eyebrow">{data.eyebrow}</span>
            <h2>
              {data.title} <em>{data.em}</em>
            </h2>
            <p className="intro">{data.intro}</p>
            <div className="visit__info">
              <div className="vrow">
                <div className="k">Address</div>
                <a className="v" href={data.mapUrl} target="_blank" rel="noopener noreferrer" style={{ whiteSpace: "pre-line" }}>
                  {displayAddress}
                </a>
              </div>
              <div className="vrow">
                <div className="k">Hours</div>
                <div className="v">
                  {data.hours}
                  <br />
                  <span className="muted">{data.hoursNote}</span>
                </div>
              </div>
              <div className="vrow">
                <div className="k">Call</div>
                <div className="v">
                  <a href={telHref(data.phone)}>{data.phone}</a>
                </div>
              </div>
            </div>
            <div className="visit__cta">
              <a className="btn btn--solid" href={data.mapUrl} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></svg>
                Get Directions
              </a>
              <a className="btn btn--ghost" href="tel:+919501370920">
                <svg viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Book an Appointment
              </a>
            </div>
          </div>

          <div 
            className="visit__card reveal"
            onMouseEnter={() => setLoadMap(true)}
            onClick={() => setLoadMap(true)}
            onTouchStart={() => setLoadMap(true)}
          >
            {loadMap ? (
              <iframe
                title="तमक by Bhavneet Store Location — Bathinda"
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, position: "absolute", inset: 0, width: "100%", height: "100%" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(250, 245, 238, 0.5)", color: "var(--gold)", cursor: "pointer", fontSize: "0.9rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Tap to load Map
              </div>
            )}
            <div className="visit__pin-badge">
              <div className="city deva">{data.cityDeva}</div>
              <div className="sub">{data.citySub}</div>
              <a
                className="visit__pin-link"
                href={data.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
