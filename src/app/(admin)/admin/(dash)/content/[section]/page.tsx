import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/content";
import { CONTENT_SCHEMA } from "@/lib/admin/content-schema";
import { CONTENT_DEFAULTS, type ContentSection } from "@/lib/content-defaults";
import SectionEditor from "@/components/admin/content/SectionEditor";

export const dynamic = "force-dynamic";

const isSection = (s: string): s is ContentSection => s in CONTENT_DEFAULTS;

export default async function ContentSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const meta = CONTENT_SCHEMA[section];
  const data = (await getContent(section)) as Record<string, unknown>;

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Content · {meta.group}</span>
          <h1 className="adm-h">{meta.title}</h1>
        </div>
        <Link className="adm-btn adm-btn--ghost" href="/admin/content">← All content</Link>
      </div>
      <SectionEditor section={section} fields={meta.fields} initial={data} />
    </>
  );
}
