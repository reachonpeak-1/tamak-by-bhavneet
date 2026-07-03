export default function Loading() {
  return (
    <main className="wrap page" aria-busy="true">
      <div className="page-head">
        <div className="skeleton" style={{ width: "9rem", height: "1rem", marginBottom: ".8rem" }} />
        <div className="skeleton" style={{ width: "16rem", height: "2.4rem" }} />
      </div>
      <div className="grid-prods">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton" style={{ aspectRatio: "4/5", borderRadius: "4px" }} />
            <div className="skeleton" style={{ height: "1rem", marginTop: ".7rem", width: "80%" }} />
            <div className="skeleton" style={{ height: ".8rem", marginTop: ".4rem", width: "50%" }} />
          </div>
        ))}
      </div>
    </main>
  );
}
