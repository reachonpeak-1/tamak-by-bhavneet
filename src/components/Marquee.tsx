import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

type Word = { hi: string; en: string };

function Run({ words, ariaHidden }: { words: Word[]; ariaHidden?: boolean }) {
  return (
    <span aria-hidden={ariaHidden}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "1.4rem" }}>
          <span className="deva">{w.hi}</span> <span className="sep">✦</span> {w.en} <span className="sep">✦</span>{" "}
        </span>
      ))}
    </span>
  );
}

export default function Marquee({ words = CONTENT_DEFAULTS.announcements.marquee }: { words?: Word[] }) {
  const items = words.length ? words : CONTENT_DEFAULTS.announcements.marquee;
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <Run words={items} />
        <Run words={items} ariaHidden />
      </div>
    </div>
  );
}
