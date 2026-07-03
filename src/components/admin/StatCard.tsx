export default function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat__label">{label}</div>
      <div className="adm-stat__value">{value}</div>
      {sub && <div className="adm-stat__sub">{sub}</div>}
    </div>
  );
}
