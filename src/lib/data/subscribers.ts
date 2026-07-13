// Server-only access to the `subscribers` table (written by the public
// newsletter form). Used by the admin broadcast route and the newsletter page.
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Active subscriber emails only (skips unsubscribed/inactive). */
export async function listActiveSubscribers(): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("subscribers")
    .select("data")
    .eq("status", "active");
  if (error) throw new Error(error.message);
  const emails = (data ?? []).map((r) =>
    String((r.data as { email?: string }).email || "").trim().toLowerCase()
  );
  return Array.from(new Set(emails.filter(Boolean)));
}

export async function countSubscribers(): Promise<{ total: number; active: number }> {
  try {
    const sb = supabaseAdmin();
    const [{ count: total }, { count: active }] = await Promise.all([
      sb.from("subscribers").select("id", { count: "exact", head: true }),
      sb.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    return { total: total ?? 0, active: active ?? 0 };
  } catch {
    return { total: 0, active: 0 };
  }
}
