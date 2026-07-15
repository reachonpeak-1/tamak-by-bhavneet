function ProductRailSkeleton({ eyebrowWidth, titleWidth }: { eyebrowWidth: string; titleWidth: string }) {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="skeleton" style={{ display: "inline-block", width: eyebrowWidth, height: ".7rem" }} />
            <span className="skeleton" style={{ display: "block", width: titleWidth, height: "2.2rem", marginTop: ".6rem" }} />
          </div>
        </div>
        <div className="rail">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="prod-card" key={i}>
              <div className="prod-card__frame">
                <div className="skeleton prod-card__skeleton" />
              </div>
              <div className="prod-card__info">
                <span className="skeleton" style={{ display: "block", width: "45%", height: ".65rem" }} />
                <span className="skeleton" style={{ display: "block", width: "80%", height: "1.15rem", marginTop: ".35rem" }} />
                <span className="skeleton" style={{ display: "block", width: "35%", height: ".78rem", marginTop: ".3rem" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <main aria-busy="true" aria-label="Loading homepage">
      {/* Hero */}
      <section className="hero">
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", minHeight: "min(86vh, 720px)" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "1.1rem",
              padding: "clamp(2rem,6vw,5rem) clamp(1.1rem,5vw,4.5rem)",
            }}
          >
            <span className="skeleton" style={{ width: "9rem", height: ".75rem" }} />
            <span className="skeleton" style={{ width: "85%", height: "3.2rem" }} />
            <span className="skeleton" style={{ width: "60%", height: "3.2rem" }} />
            <span className="skeleton" style={{ width: "90%", maxWidth: "30rem", height: "1rem", marginTop: ".6rem" }} />
            <span className="skeleton" style={{ width: "70%", maxWidth: "24rem", height: "1rem" }} />
            <div style={{ display: "flex", gap: ".85rem", marginTop: "1rem" }}>
              <span className="skeleton" style={{ width: "11rem", height: "3rem" }} />
              <span className="skeleton" style={{ width: "11rem", height: "3rem" }} />
            </div>
          </div>
          <div className="skeleton" style={{ borderRadius: 0 }} />
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee">
        <div style={{ padding: "0 var(--pad)" }}>
          <span className="skeleton skeleton--dark" style={{ display: "inline-block", width: "min(48rem, 80%)", height: "1.7rem" }} />
        </div>
      </div>

      {/* Category Rail */}
      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="skeleton" style={{ display: "inline-block", width: "8rem", height: ".7rem" }} />
              <span className="skeleton" style={{ display: "block", width: "14rem", height: "2.2rem", marginTop: ".6rem" }} />
            </div>
          </div>
          <div className="rail">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="cat" key={i}>
                <div className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New this season */}
      <ProductRailSkeleton eyebrowWidth="10rem" titleWidth="15rem" />

      {/* Story band */}
      <section className="story section">
        <div className="wrap">
          <div className="grid">
            <div>
              <span className="skeleton" style={{ display: "inline-block", width: "8rem", height: ".7rem" }} />
              <span className="skeleton" style={{ display: "block", width: "80%", height: "2.6rem", marginTop: ".7rem" }} />
              <span className="skeleton" style={{ display: "block", width: "60%", height: "2.6rem", marginTop: ".4rem" }} />
              <span className="skeleton" style={{ display: "block", width: "100%", height: "1rem", marginTop: "1.3rem" }} />
              <span className="skeleton" style={{ display: "block", width: "90%", height: "1rem", marginTop: ".5rem" }} />
              <span className="skeleton" style={{ display: "block", width: "70%", height: "1rem", marginTop: ".5rem" }} />
              <span className="skeleton" style={{ display: "inline-block", width: "9rem", height: "1rem", marginTop: "1.3rem" }} />
            </div>
            <div className="story__art">
              <div className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Most loved */}
      <ProductRailSkeleton eyebrowWidth="7rem" titleWidth="13rem" />

      {/* Testimonials */}
      <section className="testi section">
        <div className="wrap">
          <div className="sec-head" style={{ flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <span className="skeleton" style={{ display: "inline-block", width: "8rem", height: ".7rem" }} />
            <span className="skeleton" style={{ display: "block", width: "16rem", height: "2.2rem", marginTop: ".6rem" }} />
          </div>
          <div className="grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <figure className="card" key={i}>
                <span className="skeleton" style={{ width: "6rem", height: ".9rem" }} />
                <span className="skeleton" style={{ display: "block", width: "100%", height: "1.1rem", marginTop: ".4rem" }} />
                <span className="skeleton" style={{ display: "block", width: "85%", height: "1.1rem", marginTop: ".3rem" }} />
                <span className="skeleton" style={{ display: "block", width: "40%", height: ".85rem", marginTop: "auto" }} />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Promise strip */}
      <section className="promise section">
        <div className="wrap">
          <div className="grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="item" key={i}>
                <span className="skeleton skeleton--dark" style={{ flexShrink: 0, width: "48px", height: "48px", borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <span className="skeleton skeleton--dark" style={{ display: "block", width: "70%", height: "1.1rem" }} />
                  <span className="skeleton skeleton--dark" style={{ display: "block", width: "95%", height: ".85rem", marginTop: ".5rem" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit */}
      <section className="visit section">
        <div className="wrap">
          <div className="grid">
            <div>
              <span className="skeleton" style={{ display: "inline-block", width: "8rem", height: ".7rem" }} />
              <span className="skeleton" style={{ display: "block", width: "70%", height: "2.4rem", marginTop: ".7rem" }} />
              <span className="skeleton" style={{ display: "block", width: "90%", height: "1rem", marginTop: "1rem" }} />
              <div className="visit__info">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="vrow" key={i}>
                    <span className="skeleton" style={{ flex: "0 0 6rem", height: ".8rem" }} />
                    <span className="skeleton" style={{ flex: 1, height: "1rem" }} />
                  </div>
                ))}
              </div>
              <div className="visit__cta">
                <span className="skeleton" style={{ width: "11rem", height: "3rem" }} />
                <span className="skeleton" style={{ width: "11rem", height: "3rem" }} />
              </div>
            </div>
            <div className="visit__card">
              <div className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="news section">
        <div className="wrap">
          <div className="news__in">
            <span className="skeleton" style={{ display: "inline-block", width: "8rem", height: ".7rem" }} />
            <span className="skeleton" style={{ display: "block", width: "70%", margin: "0 auto", height: "2rem", marginTop: ".7rem" }} />
            <span className="skeleton" style={{ display: "block", width: "85%", margin: "0 auto", height: "1rem", marginTop: ".7rem", marginBottom: "1.7rem" }} />
            <span className="skeleton" style={{ display: "block", width: "100%", height: "2.6rem" }} />
          </div>
        </div>
      </section>
    </main>
  );
}
