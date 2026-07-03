import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { Icon } from "@/lib/icon-registry";

type Item = { title: string; sub: string; icon: string };

export default function TrustBar({ items = CONTENT_DEFAULTS.trust.items }: { items?: Item[] }) {
  return (
    <section className="trust">
      <div className="wrap">
        <div className="grid">
          {items.map((it) => (
            <div className="item" key={it.title}>
              <span className="ic"><Icon name={it.icon} /></span>
              <div>
                <b>{it.title}</b>
                <small>{it.sub}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
