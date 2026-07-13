import Link from "next/link";
import Image from "next/image";
import Rail from "./Rail";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { categoryQuery, type Category } from "@/lib/data/categories";

type Data = typeof CONTENT_DEFAULTS.categoryRail;
const vb = (m: string) => (m === "mandala" ? "0 0 200 200" : "0 0 240 280");

// Cards come from the admin-managed `categories` collection (name + photo). The
// eyebrow/title still come from the editable categoryRail content section.
export default function CategoryRail({ data = CONTENT_DEFAULTS.categoryRail, cats = [] }: { data?: Data; cats?: Category[] }) {
  if (cats.length === 0) return null;

  return (
    <Rail id="categories" eyebrow={data.eyebrow} title={data.title}>
      {cats.map((c, i) => {
        const image = c.image || "";
        const pos = c.pos || "center top";

        return (
          <Link className={image ? "cat cat--photo" : "cat"} href={`/shop?cat=${categoryQuery(c.name)}`} key={c.id}>
            {image && (
              <Image
                className="cat__photo"
                src={image}
                alt={c.name}
                fill
                sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 640px"

                priority={i < 2}
                style={{ objectPosition: pos }}
              />
            )}
            <div className={`panel ${c.panel}`} />
            <div className={`motif ${c.tone}`}>
              <svg viewBox={vb(c.motif)}>
                <use href={`#${c.motif}`} />
              </svg>
            </div>
            <div className="grad" />
            <div className="meta">
              {c.deva && <div className="deva">{c.deva}</div>}
              <h3>{c.name}</h3>
              {c.cnt && <div className="cnt">{c.cnt}</div>}
            </div>
          </Link>
        );
      })}
    </Rail>
  );
}
