import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Reach तमक by Bhavneet — Bathinda atelier, phone, email and WhatsApp.",
};

export default function Contact() {
  const mapUrl = "https://maps.app.goo.gl/k51zrDBvvqmbMQig8";
  const embedUrl = "https://maps.google.com/maps?q=30.179151,74.939499&hl=en&z=15&output=embed";

  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Here to help</span>
        <h1>Contact us</h1>
      </div>
      <p>We’d love to help with sizing, orders or anything about our pieces.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginTop: "1.5rem" }}>
        <div>
          <h3>Email</h3>
          <p><a href="mailto:care@tamak.in">care@tamak.in</a></p>

          <h3>Phone / WhatsApp</h3>
          <p><a href="tel:+919501370920">+91 95013 70920</a> · Mon–Sat, 10am–7pm IST</p>

          <h3>Atelier Location</h3>
          <p>
            SCO - 40, Dabwali Rd, Ganpati Enclave,<br />
            Bathinda, Punjab 151001, India
          </p>

          <p style={{ marginTop: "1rem" }}>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--solid"
              style={{ display: "inline-flex", gap: "0.5rem" }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
              Open in Google Maps
            </a>
          </p>
        </div>

        {/* Embedded Interactive Map */}
        <div style={{ position: "relative", width: "100%", height: "320px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--line)" }}>
          <iframe
            title="तमक by Bhavneet Store Location"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <h3 style={{ marginTop: "2.5rem" }}>Business details</h3>
      <p className="muted">
        तमक by Bhavneet. Operated by Bhavneet. GSTIN and full legal entity details available on request and on tax
        invoices.
      </p>
    </main>
  );
}
