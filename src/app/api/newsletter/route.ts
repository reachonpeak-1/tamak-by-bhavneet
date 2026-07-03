import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// Public subscribe endpoint. Writes via Admin SDK (client SDK is denied by rules).
export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const db = adminDb();
    const existing = await db.collection("subscribers").where("email", "==", email).limit(1).get();
    if (existing.empty) {
      await db.collection("subscribers").add({
        email,
        source: String(body.source ?? "site").slice(0, 40),
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("newsletter error", e);
    return NextResponse.json({ error: "Could not subscribe" }, { status: 503 });
  }
}
