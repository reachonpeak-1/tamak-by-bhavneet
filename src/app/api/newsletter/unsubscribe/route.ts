import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyUnsub } from "@/lib/email/unsubscribe";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tamak.in";

// Escape untrusted text before it goes into the HTML response — the email is
// attacker-controllable (subscribe accepts arbitrary local-parts).
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function page(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(title)}</title></head>
  <body style="margin:0;background:#f6f1e7;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:12vh auto;background:#fffdf8;border:1px solid #ece3d2;border-radius:10px;padding:36px;text-align:center">
      <div style="font:700 28px/1 Georgia,serif;color:#a9823a;letter-spacing:.06em">तमक</div>
      <h1 style="font:600 20px/1.3 Georgia,serif;color:#241a0c;margin:22px 0 10px">${esc(title)}</h1>
      <p style="font-size:14px;line-height:1.6;color:#5b4f3b">${body}</p>
      <a href="${SITE}" style="display:inline-block;margin-top:18px;background:#a9823a;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:4px">Back to store</a>
    </div>
  </body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

// Public one-click unsubscribe target. Verifies the signed link, then flips the
// matching subscriber to status="unsubscribed".
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const token = url.searchParams.get("t") || "";

  if (!verifyUnsub(email, token)) {
    return page("Invalid link", "This unsubscribe link is invalid or has expired. Please contact us if you'd like to be removed.");
  }

  try {
    const sb = supabaseAdmin();
    const { data: row } = await sb.from("subscribers").select("id,data").eq("email", email).maybeSingle();
    if (row) {
      const merged = {
        ...(row.data as Record<string, unknown>),
        status: "unsubscribed",
        unsubscribedAt: new Date().toISOString(),
      };
      const { error } = await sb.from("subscribers").update({ data: merged }).eq("id", row.id);
      if (error) throw error;
    }
  } catch (e) {
    console.error("[unsubscribe] failed:", (e as Error).message);
    return page("Something went wrong", "We couldn't process that just now. Please try again later.");
  }

  return page("You're unsubscribed", `<b>${esc(email)}</b> won't receive any more newsletters from us. We're sorry to see you go.`);
}
