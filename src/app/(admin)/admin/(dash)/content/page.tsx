import Link from "next/link";
import { CONTENT_SCHEMA } from "@/lib/admin/content-schema";
import { CONTENT_SECTIONS } from "@/lib/content-defaults";

export const dynamic = "force-dynamic";

export default function ContentLanding() {
  const groups = new Map<string, { section: string; title: string }[]>();
  for (const s of CONTENT_SECTIONS) {
    const meta = CONTENT_SCHEMA[s];
    if (!groups.has(meta.group)) groups.set(meta.group, []);
    groups.get(meta.group)!.push({ section: s, title: meta.title });
  }

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Content</span>
          <h1 className="adm-h">Site content</h1>
          <p className="adm-sub">Edit homepage sections, announcements, store info, footer and navigation. Changes go live immediately.</p>
        </div>
      </div>

      {[...groups.entries()].map(([group, items]) => (
        <div className="adm-content-group" key={group}>
          <h2>{group}</h2>
          <div className="adm-content-grid">
            {items.map((it) => (
              <Link key={it.section} href={`/admin/content/${it.section}`} className="adm-content-card">
                <b>{it.title}</b>
                <small>Edit ›</small>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
