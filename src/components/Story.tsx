import Image from "next/image";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

type Data = typeof CONTENT_DEFAULTS.story;

export default function Story({ data = CONTENT_DEFAULTS.story }: { data?: Data }) {
  return (
    <section className="story section" id="story">
      <div className="wrap">
        <div className="grid">
          <div className="reveal">
            <span className="eyebrow">{data.eyebrow}</span>
            <h2>
              {data.title} <em>{data.em}</em>
            </h2>
            {data.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <a className="link-u" href={data.ctaHref}>
              {data.ctaLabel} <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <div className="sign">{data.sign}</div>
          </div>
          <div className="story__art reveal">
            <Image
              src="/story/story-craft-1.png"
              alt="Handwoven artisan craft — तमक by Bhavneet"
              fill
              className="story__art-img"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="story__art-overlay" />
            <div className="frame-line" />
            <div className="story__art-badge">
              <span className="deva">हस्तकला</span>
              <small>HAND CRAFTED ARTISTRY</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
