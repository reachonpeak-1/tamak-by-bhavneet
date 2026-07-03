// Dependency-free SVG donut chart with legend.
export default function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="adm-donut">
      <svg viewBox="0 0 100 100" width="128" height="128" role="img" aria-label="Breakdown">
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--cream-2)" strokeWidth="13" />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="13"
                strokeDasharray={`${len.toFixed(2)} ${(c - len).toFixed(2)}`}
                strokeDashoffset={(-offset).toFixed(2)}
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="adm-legend">
        {segments.map((s, i) => (
          <span key={i}>
            <i style={{ background: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
}
