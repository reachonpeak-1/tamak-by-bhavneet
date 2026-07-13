// Server-only history of sent broadcast emails. Written by the admin send route,
// read by the newsletter admin page. Read fresh (admin needs live data).
import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TemplateId } from "@/lib/email/template-config";

export interface Campaign {
  id: string;
  template: TemplateId;
  subject: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  test: boolean;
  sentBy: string;
  createdAt: string;
}

export async function listCampaigns(limit = 50): Promise<Campaign[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("campaigns")
      .select("id,data")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...(r.data as Omit<Campaign, "id">), id: r.id }));
  } catch {
    return []; // table may be empty/unreachable
  }
}
