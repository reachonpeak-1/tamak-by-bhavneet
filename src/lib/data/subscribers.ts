// Server-only access to the `subscribers` collection (written by the public
// newsletter form). Used by the admin broadcast route and the newsletter page.
import "server-only";
import { adminDb } from "@/lib/firebase/admin";

/** Active subscriber emails only (skips unsubscribed/inactive). */
export async function listActiveSubscribers(): Promise<string[]> {
  const snap = await adminDb().collection("subscribers").where("status", "==", "active").get();
  const emails = snap.docs.map((d) => String((d.data() as { email?: string }).email || "").trim().toLowerCase());
  return Array.from(new Set(emails.filter(Boolean)));
}

export async function countSubscribers(): Promise<{ total: number; active: number }> {
  try {
    const snap = await adminDb().collection("subscribers").get();
    const active = snap.docs.filter((d) => (d.data() as { status?: string }).status === "active").length;
    return { total: snap.size, active };
  } catch {
    return { total: 0, active: 0 };
  }
}
