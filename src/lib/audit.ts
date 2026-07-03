import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export interface AuditEntry {
  actor?: string;
  action: string; // e.g. "product.create", "order.update", "content.save"
  target?: { collection: string; id: string };
  before?: unknown;
  after?: unknown;
}

// Append-only admin activity trail. Failures never block the mutation.
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await adminDb()
      .collection("auditLog")
      .add({
        actor: entry.actor ?? "system",
        action: entry.action,
        target: entry.target ?? null,
        before: entry.before ?? null,
        after: entry.after ?? null,
        at: new Date().toISOString(),
      });
  } catch (e) {
    console.error("[audit] failed:", (e as Error).message);
  }
}
