import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

interface Entry { id: string; at: string; actor: string; action: string; target?: { collection: string; id: string } | null }

export default async function AuditPage() {
  let entries: Entry[] = [];
  try {
    const snap = await adminDb().collection("auditLog").orderBy("at", "desc").limit(200).get();
    entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Entry, "id">) }));
  } catch {
    /* may not exist yet */
  }

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Security</span>
          <h1 className="adm-h">Audit log</h1>
          <p className="adm-sub">Last {entries.length} admin actions</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="adm-card adm-muted">No activity recorded yet.</div>
      ) : (
        <table className="adm-table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td data-label="When">{new Date(e.at).toLocaleString("en-IN")}</td>
                <td data-label="Who">{e.actor}</td>
                <td data-label="Action"><span className="adm-pill">{e.action}</span></td>
                <td data-label="Target">{e.target ? `${e.target.collection}/${e.target.id}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
