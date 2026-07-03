"use client";

import { useEffect, useRef, useState } from "react";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

export default function Topbar({ messages = CONTENT_DEFAULTS.announcements.topbar }: { messages?: string[] }) {
  const MSGS = messages.length ? messages : CONTENT_DEFAULTS.announcements.topbar;
  const [i, setI] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const span = ref.current;
      if (!span) return;
      span.style.transform = "translateY(-100%)";
      setTimeout(() => {
        setI((m) => (m + 1) % MSGS.length);
        span.style.transition = "none";
        span.style.transform = "translateY(100%)";
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            span.style.transition = "";
            span.style.transform = "translateY(0)";
          })
        );
      }, 600);
    }, 4200);
    return () => clearInterval(id);
  }, [MSGS.length]);

  return (
    <div className="topbar">
      <div className="wrap">
        <div className="roll" id="roll" aria-live="polite">
          <span ref={ref}>
            {MSGS[i].split("·").map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && <span className="gold">·</span>}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
