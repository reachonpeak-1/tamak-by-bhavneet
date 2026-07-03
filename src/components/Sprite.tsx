// SVG motif definitions (paisley + mandala), rendered once. Server component.
export default function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {/* organic curved divider for the hero image (objectBoundingBox 0–1) */}
        <clipPath id="heroCurve" clipPathUnits="objectBoundingBox">
          <path d="M0.24,0 C0.06,0.18 0.30,0.42 0.12,0.62 C0.03,0.79 0.18,0.91 0.16,1 L1,1 L1,0 Z" />
        </clipPath>
        <g id="paisley">
          <path
            d="M70 235 C20 215 18 130 70 95 C112 67 160 80 160 130 C160 168 128 188 100 175 C80 166 78 138 96 130 C108 124 120 132 116 144"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M70 235 C38 218 34 150 74 120 C104 98 138 108 138 142 C138 165 118 178 100 170"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            opacity=".7"
          />
          <circle cx="92" cy="150" r="4" fill="currentColor" />
          <circle cx="80" cy="170" r="3" fill="currentColor" opacity=".8" />
          <circle cx="70" cy="192" r="2.6" fill="currentColor" opacity=".6" />
          <g fill="currentColor" opacity=".85">
            <circle cx="110" cy="120" r="3.4" />
            <circle cx="124" cy="132" r="2.4" />
            <circle cx="98" cy="112" r="2.4" />
          </g>
        </g>
        <g id="mandala">
          <defs>
            <path id="pet" d="M100 100 C90 64 90 40 100 18 C110 40 110 64 100 100 Z" />
          </defs>
          <g fill="currentColor">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
              <use key={d} href="#pet" transform={`rotate(${d} 100 100)`} />
            ))}
          </g>
          <g fill="currentColor" opacity=".6">
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((d) => (
              <use key={d} href="#pet" transform={`rotate(${d} 100 100) scale(.62) translate(61 61)`} />
            ))}
          </g>
          <circle cx="100" cy="100" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="4" fill="currentColor" />
        </g>
      </defs>
    </svg>
  );
}
