import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Coarse edge gate: bounce /admin/* to the login screen when no session cookie
// is present. Real verification (valid cookie + admin claim) happens in the
// admin layout via requireAdminSession() and in every mutation API via
// requireAdmin(). Proxy must stay lightweight — no firebase-admin here.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!request.cookies.has("__session")) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
