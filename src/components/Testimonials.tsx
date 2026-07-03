import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

type Data = typeof CONTENT_DEFAULTS.testimonials;

export default function Testimonials({ data = CONTENT_DEFAULTS.testimonials }: { data?: Data }) {
  return (
    <section className="testi section">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{data.eyebrow}</span>
          <h2 className="ttl">{data.title}</h2>
          <p>{data.sub}</p>
        </div>
        <div className="grid stagger">
          {data.reviews.map((r, i) => (
            <figure className="card" key={i}>
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <blockquote>“{r.quote}”</blockquote>
              <figcaption className="who">
                <b>{r.who}</b> &nbsp;<span>{r.city}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
