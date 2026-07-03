// Server-only history of sent broadcast emails. Written by the admin send route,
// read by the newsletter admin page. Read fresh (admin needs live data).
import "server-only";
import { adminDb } from "@/lib/firebase/admin";
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
    const snap = await adminDb().collection("campaigns").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, "id">) }));
  } catch {
    return []; // collection may not exist yet
  }
}
