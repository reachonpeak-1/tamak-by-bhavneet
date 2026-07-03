// Dependency-free SVG line+area chart. Server-renderable (no hooks).
export default function LineChart({
  data,
  height = 170,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const w = 680;
  const h = height;
  const pad = { l: 10, r: 10, t: 14, b: 24 };
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (w - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${pad.l},${h - pad.b} ${pts} ${x(n - 1)},${h - pad.b}`;
  const step = Math.max(1, Math.ceil(n / 8));

  if (n === 0) return <p className="adm-muted">No data for this range.</p>;

  return (
    <svg className="adm-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Revenue over time">
      <line className="axis" x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} />
      <polygon className="ar" points={area} />
      <polyline className="ln" points={pts} />
      {data.map((d, i) => (
        <circle key={i} className="dot" cx={x(i)} cy={y(d.value)} r={2.4} />
      ))}
      {data.map((d, i) =>
        i % step === 0 ? (
          <text key={`l${i}`} className="lbl" x={x(i)} y={h - 8} textAnchor="middle">
            {d.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
