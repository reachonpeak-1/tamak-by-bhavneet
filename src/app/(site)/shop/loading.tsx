export default function ShopLoading() {
  return (
    <main className="wrap page shop-page" aria-busy="true" aria-label="Loading shop">
      <nav className="shop-breadcrumb" aria-hidden="true">
        <span className="skeleton" style={{ display: "inline-block", width: "3.5rem", height: ".7rem" }} />
      </nav>

      <header className="page-head">
        <span className="skeleton" style={{ display: "inline-block", width: "9rem", height: ".7rem" }} />
        <h1>
          <span className="skeleton" style={{ display: "inline-block", width: "13rem", height: "2.6rem", marginTop: ".5rem" }} />
        </h1>
        <p>
          <span className="skeleton" style={{ display: "inline-block", width: "min(38rem, 100%)", height: "1rem", marginTop: ".6rem" }} />
        </p>
      </header>

      <div className="shop-toolbar-skeleton" style={{ display: "flex", flexWrap: "wrap", gap: ".7rem", margin: "1.8rem 0" }}>
        <span className="skeleton" style={{ flex: "1 1 220px", height: "2.6rem" }} />
        <span className="skeleton" style={{ width: "9rem", height: "2.6rem" }} />
        <span className="skeleton" style={{ width: "9rem", height: "2.6rem" }} />
        <span className="skeleton" style={{ width: "9rem", height: "2.6rem" }} />
      </div>

      <div className="grid-prods cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
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
    </main>
  );
}
