// Dependency-free horizontal bar chart (good for long product names).
export default function BarChart({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="adm-muted">No data yet.</p>;
  return (
    <div className="adm-bars">
      {data.map((d, i) => (
        <div className="adm-bar" key={i}>
          <span className="adm-bar__lbl" title={d.label}>{d.label}</span>
          <span className="adm-bar__track">
            <span className="adm-bar__fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="adm-bar__val">{d.sub ?? d.value}</span>
        </div>
      ))}
    </div>
  );
}
