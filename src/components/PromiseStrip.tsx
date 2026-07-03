import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { Icon } from "@/lib/icon-registry";

type Item = { title: string; body: string; icon: string };

export default function PromiseStrip({ items = CONTENT_DEFAULTS.promise.items }: { items?: Item[] }) {
  return (
    <section className="promise section">
      <div className="wrap">
        <div className="grid stagger">
          {items.map((it) => (
            <div className="item" key={it.title}>
              <span className="ic"><Icon name={it.icon} /></span>
              <div>
                <h4>{it.title}</h4>
                <p>{it.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
