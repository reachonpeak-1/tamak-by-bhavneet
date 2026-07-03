"use client";

import { useEffect, useRef } from "react";

interface Props {
  id?: string;
  eyebrow: string;
  title: string;
  desc?: string;
  padTop0?: boolean;
  children: React.ReactNode;
}

export default function Rail({ id, eyebrow, title, desc, padTop0, children }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const fill = fillRef.current;
    if (!rail || !fill) return;
    const upd = () => {
      const w = (rail.clientWidth / rail.scrollWidth) * 100;
      const max = rail.scrollWidth - rail.clientWidth;
      const ratio = max > 0 ? rail.scrollLeft / max : 0;
      fill.style.width = `${w}%`;
      fill.style.left = `${ratio * (100 - w)}%`;
    };
    rail.addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    const t = setTimeout(upd, 60);
    return () => {
      rail.removeEventListener("scroll", upd);
      removeEventListener("resize", upd);
      clearTimeout(t);
    };
  }, []);

  const scrollBy = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("*");
    const step = card ? card.getBoundingClientRect().width + 24 : 300;
    rail.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section className="section" id={id} style={padTop0 ? { paddingTop: 0 } : undefined}>
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="ttl">{title}</h2>
            {desc && <p>{desc}</p>}
          </div>
          <div className="rail-ctrl">
            <button aria-label="Previous" onClick={() => scrollBy(-1)}>
              <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button aria-label="Next" onClick={() => scrollBy(1)}>
              <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <span className="swipe-hint">
            Swipe <svg viewBox="0 0 24 12"><path d="M2 6h19M16 1l5 5-5 5" /></svg>
          </span>
        </div>
        <div className="rail stagger" ref={railRef}>
          {children}
        </div>
        <div className="rail-prog">
          <i ref={fillRef} />
        </div>
      </div>
    </section>
  );
}
