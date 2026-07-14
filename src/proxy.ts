import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Supabase auth cookies are named sb-<project-ref>-auth-token (possibly
// chunked into .0/.1 suffixes). Derive the prefix from the project URL.
const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .replace(/^https?:\/\//, "")
  .split(".")[0];
const COOKIE_PREFIX = `sb-${projectRef}-auth-token`;

// Coarse edge gate: bounce /admin/* to the login screen when no session cookie
// is present. Real verification (valid session + is_admin) happens in the
// admin layout via requireAdminSession() and in every mutation API via
// requireAdmin(). Proxy must stay lightweight — no supabase SDK here.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  // The PKCE code-verifier cookie shares this prefix but means "an OAuth flow
  // has started", not "signed in" — don't let it pass as a session.
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(COOKIE_PREFIX) && !c.name.endsWith("-code-verifier"));
  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
