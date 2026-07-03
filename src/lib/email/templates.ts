// Server-side HTML email rendering. Inline CSS only (email clients drop <style>
// and external CSS). Brand copy (address, footer) is reused from CONTENT_DEFAULTS.
import "server-only";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";
import { TEMPLATE_BY_ID, type TemplateId } from "./template-config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tamak.in";
const GOLD = "#a9823a";
const INK = "#241a0c";

/** Make a link absolute against the site origin. */
const abs = (u: string) => (!u ? "" : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`);

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");

export interface CampaignFields {
  heading?: string;
  intro?: string;
  body?: string;
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

function button(label?: string, url?: string): string {
  if (!label || !url) return "";
  return `<tr><td align="center" style="padding:12px 0 4px">
    <a href="${abs(url)}" style="display:inline-block;background:${GOLD};color:#fff;text-decoration:none;
      font:600 14px/1 Arial,sans-serif;letter-spacing:.04em;padding:14px 28px;border-radius:4px">${esc(label)}</a>
  </td></tr>`;
}

function productCards(products: Product[]): string {
  if (!products.length) return "";
  const cell = (p: Product) => {
    const img = abs(p.image || p.gallery?.[0]?.url || "");
    const url = abs(`/product/${p.slug}`);
    return `<td width="50%" valign="top" style="padding:8px">
      <a href="${url}" style="text-decoration:none;color:${INK}">
        ${img ? `<img src="${img}" alt="${esc(p.name)}" width="252" style="width:100%;max-width:252px;height:auto;border-radius:6px;display:block;border:0"/>` : ""}
        <div style="font:600 15px/1.3 Georgia,serif;margin:10px 0 2px">${esc(p.name)}</div>
        <div style="font:400 13px/1.3 Arial,sans-serif;color:#6b5d45">${esc(p.fabric || "")}</div>
        <div style="font:700 15px/1.3 Arial,sans-serif;color:${GOLD};margin-top:4px">₹${inr(p.price)}</div>
      </a>
    </td>`;
  };
  let rows = "";
  for (let i = 0; i < products.length; i += 2) {
    rows += `<tr>${cell(products[i])}${products[i + 1] ? cell(products[i + 1]) : '<td width="50%"></td>'}</tr>`;
  }
  return `<tr><td style="padding:8px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`;
}

function layout(inner: string, unsubscribeUrl: string): string {
  const store = CONTENT_DEFAULTS.storeInfo;
  const foot = CONTENT_DEFAULTS.footer;
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f6f1e7">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#fffdf8;border-radius:10px;overflow:hidden;border:1px solid #ece3d2">
        <tr><td align="center" style="background:${INK};padding:22px">
          <div style="font:700 26px/1 Georgia,serif;color:${GOLD};letter-spacing:.06em">तमक</div>
          <div style="font:400 11px/1 Arial,sans-serif;color:#cbbb97;letter-spacing:.22em;margin-top:6px;text-transform:uppercase">by Bhavneet</div>
        </td></tr>
        ${inner}
        <tr><td style="padding:22px 24px;border-top:1px solid #ece3d2;background:#fbf7ef">
          <div style="font:400 12px/1.6 Arial,sans-serif;color:#8a7c63">
            ${esc((store.address || "").replace(/\n/g, ", "))}<br/>
            ${esc(foot.email || "")}${foot.phone ? " · " + esc(foot.phone) : ""}
          </div>
          <div style="font:400 11px/1.6 Arial,sans-serif;color:#a99c84;margin-top:10px">
            You're receiving this because you subscribed at ${esc(SITE)}.
            <a href="${unsubscribeUrl}" style="color:${GOLD}">Unsubscribe</a>.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function renderCampaign(
  template: TemplateId,
  fields: CampaignFields,
  products: Product[],
  unsubscribeUrl: string
): string {
  const def = TEMPLATE_BY_ID[template];
  const heading = esc(fields.heading || def?.label || "");
  const intro = fields.intro || fields.body || fields.message || "";

  const inner =
    `<tr><td style="padding:28px 24px 8px" align="center">
      ${heading ? `<h1 style="font:600 24px/1.25 Georgia,serif;color:${INK};margin:0 0 10px">${heading}</h1>` : ""}
      ${intro ? `<p style="font:400 15px/1.6 Arial,sans-serif;color:#5b4f3b;margin:0 16px">${nl2br(intro)}</p>` : ""}
    </td></tr>
    ${def?.useProducts ? productCards(products) : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${button(fields.ctaLabel, fields.ctaUrl)}</table>
    <tr><td style="height:18px"></td></tr>`;

  return layout(inner, unsubscribeUrl);
}
