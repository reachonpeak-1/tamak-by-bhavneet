import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

// POST { idToken } → verify the fresh ID token, require admin claim, mint a
// __session cookie (createSessionCookie). The admin client calls this right
// after sign-in. DELETE clears it (sign-out).
export async function POST(req: Request) {
  let idToken: string | undefined;
  try {
    ({ idToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Not an admin account" }, { status: 403 });
    }
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
    (await cookies()).set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FIVE_DAYS_MS / 1000,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not verify token" }, { status: 401 });
  }
}

export async function DELETE() {
  (await cookies()).delete("__session");
  return NextResponse.json({ ok: true });
}
