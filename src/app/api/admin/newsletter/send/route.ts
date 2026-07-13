import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getAllProductsFresh, getNewIn } from "@/lib/data/products";
import { listActiveSubscribers } from "@/lib/data/subscribers";
import { sendMail } from "@/lib/email/mailer";
import { renderCampaign, type CampaignFields } from "@/lib/email/templates";
import { unsubUrl } from "@/lib/email/unsubscribe";
import { TEMPLATE_BY_ID, type TemplateId } from "@/lib/email/template-config";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  template?: TemplateId;
  subject?: string;
  fields?: CampaignFields;
  productIds?: string[];
  test?: boolean;
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let b: Body;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template = b.template as TemplateId;
  const def = TEMPLATE_BY_ID[template];
  if (!def) return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  const subject = String(b.subject ?? "").trim();
  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  const fields = (b.fields ?? {}) as CampaignFields;

  // Resolve products for product templates: hand-picked ids, else auto (New).
  let products: Product[] = [];
  if (def.useProducts) {
    if (Array.isArray(b.productIds) && b.productIds.length) {
      const all = await getAllProductsFresh();
      const byId = new Map(all.map((p) => [p.id, p]));
      products = b.productIds.map((id) => byId.get(id)).filter(Boolean) as Product[];
    } else {
      products = await getNewIn();
    }
  }

  // Recipients: test → just the admin; otherwise all active subscribers.
  const test = b.test === true;
  let recipients: string[];
  if (test) {
    if (!admin.email) return NextResponse.json({ error: "Your admin account has no email for the test send" }, { status: 400 });
    recipients = [admin.email];
  } else {
    recipients = await listActiveSubscribers();
  }
  if (!recipients.length) return NextResponse.json({ error: "No active subscribers to send to" }, { status: 400 });

  let sentCount = 0;
  let failedCount = 0;
  for (const to of recipients) {
    try {
      const html = renderCampaign(template, fields, products, unsubUrl(to));
      await sendMail({ to, subject, html });
      sentCount++;
    } catch (e) {
      failedCount++;
      console.error(`[newsletter] send to ${to} failed:`, (e as Error).message);
    }
  }

  // Persist a campaign record + audit trail for real (non-test) broadcasts.
  if (!test) {
    const record = {
      template,
      subject,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      test: false,
      sentBy: admin.email ?? admin.uid,
      createdAt: new Date().toISOString(),
    };
    try {
      const { error } = await supabaseAdmin().from("campaigns").insert({ data: record });
      if (error) throw error;
    } catch (e) {
      console.error("[newsletter] campaign record failed:", (e as Error).message);
    }
    await logAudit({ actor: admin.email ?? admin.uid, action: "newsletter.send", target: { collection: "campaigns", id: template }, after: record });
  }

  return NextResponse.json({ ok: true, sentCount, failedCount, recipientCount: recipients.length, test });
}
