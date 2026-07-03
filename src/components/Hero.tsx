"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_SLIDES = [
  {
    eyebrow: "Ethnic Wear · Made to Celebrate",
    title: "Rooted in tradition.",
    em: "Made to be yours.",
    sub: "Timeless ethnic wear crafted with heritage techniques and exquisite details — for every moment that matters.",
    cta: [{ label: "Shop Ethnic Wear", href: "/shop" }, { label: "Explore New In", href: "/shop?sort=new" }],
    image: "/hero/hero-ethnic-wide.jpg",
    tone: "light" as const,
    layout: "full" as const,
    pos: "center top",
  },
  {
    eyebrow: "Bridal · Made to Measure",
    title: "Woven for the",
    em: "day you’ll remember.",
    sub: "Lehengas and sarees in real zari and raw silk, cut to your measurements and embroidered entirely by hand.",
    cta: [{ label: "The Bridal Edit", href: "/shop?occasion=Bridal" }, { label: "Book a Fitting", href: "/#visit" }],
    image: "/hero/hero-blush-wide.jpg",
    tone: "light" as const,
    layout: "full" as const,
    pos: "center top",
  },
  {
    eyebrow: "New This Season",
    title: "Fresh off",
    em: "the loom.",
    sub: "A small-batch drop of organza, Chanderi and mul-cotton everyday luxe — once the weave is retired, it’s gone.",
    cta: [{ label: "Shop New In", href: "/shop?sort=new" }, { label: "Browse All", href: "/shop" }],
    image: "/hero/hero-noir-wide.png",
    tone: "light" as const,
    layout: "full" as const,
    pos: "center top",
  },
];

type Slide = {
  eyebrow: string; title: string; em: string; sub: string;
  image: string; pos: string; cta: { label: string; href: string }[];
  tone?: string; layout?: string;
};

export default function Hero({ slides = DEFAULT_SLIDES }: { slides?: Slide[] }) {
  const SLIDES = (slides.length ? slides : DEFAULT_SLIDES).map((s) => ({
    ...s,
    tone: (s as Slide).tone ?? "light",
    layout: (s as Slide).layout ?? "full",
  }));
  const n = SLIDES.length;
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touch = useRef<{ x0: number | null; dx: number }>({ x0: null, dx: 0 });
  const rm = useRef(false);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);
  const start = useCallback(() => {
    if (rm.current) return;
    stop();
    timer.current = setInterval(() => setIdx((i) => (i + 1) % n), 6000);
  }, [n, stop]);

  useEffect(() => {
    rm.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [start, stop]);

  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      stop();
    }
  };
  const handleMouseLeave = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      start();
    }
  };
  const handleFocus = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      stop();
    }
  };
  const handleBlur = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      start();
    }
  };

  const go = (i: number, user?: boolean) => {
    setIdx((i + n) % n);
    if (user) start();
  };

  const dark = (SLIDES[idx].tone as string) === "dark";

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      tabIndex={-1}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(idx - 1, true);
        else if (e.key === "ArrowRight") go(idx + 1, true);
      }}
    >
      <div className="hero__viewport">
        <div
          className="hero__track"
          ref={trackRef}
          style={{ transform: `translate3d(-${idx * 100}%, 0, 0)` }}
          onTouchStart={(e) => {
            touch.current = { x0: e.touches[0].clientX, dx: 0 };
            stop();
          }}
          onTouchMove={(e) => {
            if (touch.current.x0 !== null) touch.current.dx = e.touches[0].clientX - touch.current.x0;
          }}
          onTouchEnd={() => {
            if (Math.abs(touch.current.dx) > 45) go(idx + (touch.current.dx < 0 ? 1 : -1));
            touch.current.x0 = null;
            start();
          }}
        >
          {SLIDES.map((s, i) => (
            <article
              key={i}
              className={`hero__slide tone-${s.tone} layout-${s.layout} ${i === idx ? "is-active" : ""}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
            >
              <div className="hero__bg">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  style={{ objectFit: "cover", objectPosition: s.pos ?? "center" }}
                />
              </div>
              <div className="hero__scrim" />
              <div className="hero__copy">
                <span className="eyebrow">{s.eyebrow}</span>
                <h1>
                  {s.title} <em>{s.em}</em>
                </h1>
                <p className="hero__sub">{s.sub}</p>
                <div className="hero__cta">
                  <Link className="btn btn--solid" href={s.cta[0].href}>
                    {s.cta[0].label}
                  </Link>
                  <Link className={`btn ${(s.tone as string) === "dark" ? "btn--lite" : "btn--ghost"}`} href={s.cta[1].href}>
                    {s.cta[1].label}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={`hero__controls${dark ? " on-dark" : ""}`}>
        <button className="hero__nav" aria-label="Previous slide" onClick={() => go(idx - 1, true)}>
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="hero__dots" role="tablist" aria-label="Choose slide">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-label={`Go to slide ${i + 1}`}
              aria-selected={i === idx}
              className={i === idx ? "active" : ""}
              onClick={() => go(i, true)}
            />
          ))}
        </div>
        <button className="hero__nav" aria-label="Next slide" onClick={() => go(idx + 1, true)}>
          <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <span className="hero__count">
          <b>{("0" + (idx + 1)).slice(-2)}</b> — {("0" + n).slice(-2)}
        </span>
      </div>
    </section>
  );
}
