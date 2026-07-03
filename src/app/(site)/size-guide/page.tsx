import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size guide",
  description: "Measurements and fit guidance for तमक suits, kurtas and sarees.",
};

const ROWS = [
  ["XS", "32", "26", "34"],
  ["S", "34", "28", "36"],
  ["M", "36", "30", "38"],
  ["L", "38", "32", "40"],
  ["XL", "40", "34", "42"],
  ["XXL", "42", "36", "44"],
];

export default function SizeGuide() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Fit</span>
        <h1>Size guide</h1>
      </div>
      <p>All measurements are body measurements in inches. For the truest fit, choose made-to-measure at checkout.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "1rem 0" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
            <th style={{ padding: ".5rem .4rem" }}>Size</th>
            <th style={{ padding: ".5rem .4rem" }}>Bust</th>
            <th style={{ padding: ".5rem .4rem" }}>Waist</th>
            <th style={{ padding: ".5rem .4rem" }}>Hip</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r[0]} style={{ borderBottom: "1px solid var(--line-2)" }}>
              {r.map((c, i) => (
                <td key={i} style={{ padding: ".5rem .4rem", color: i === 0 ? "var(--ink)" : "var(--ink-soft)" }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h3>How to measure</h3>
      <ul>
        <li><b>Bust:</b> around the fullest part of your chest.</li>
        <li><b>Waist:</b> around the narrowest part of your natural waist.</li>
        <li><b>Hip:</b> around the fullest part of your hips.</li>
      </ul>
      <p className="muted">Need help? WhatsApp or email care@tamak.in and we’ll guide you.</p>
    </main>
  );
}
