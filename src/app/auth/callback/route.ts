import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/supabase/requireAdminSession";

// Server-side PKCE code exchange for OAuth (Google) sign-in. We do this here
// instead of relying on the browser client's automatic ?code= detection —
// that path silently no-ops if it can't find its own code-verifier in
// storage at the right moment, with no error surfaced. A Route Handler reads
// the same code-verifier cookie straight off the incoming request, so it
// doesn't depend on that client-side timing at all.
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";
  const errorDescription = searchParams.get("error_description");
  const loginPath = next.startsWith("/admin") ? "/admin/login" : "/account";

  if (errorDescription) {
    return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent(errorDescription)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent("No sign-in code was returned. Please try again.")}`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchange failed:", error.name, error.message);
    // A missing verifier means the cookie written at sign-in start is gone
    // (cleared, or the flow was resumed in a different browser/tab).
    const stale = error.name === "AuthPKCECodeVerifierMissingError" || /code verifier/i.test(error.message);
    const message = stale ? "Sign-in session expired. Please try again." : error.message;
    return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent(message)}`);
  }

  if (next.startsWith("/admin")) {
    const admin = await requireAdminSession();
    if (!admin) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent("This account is not an admin")}`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
