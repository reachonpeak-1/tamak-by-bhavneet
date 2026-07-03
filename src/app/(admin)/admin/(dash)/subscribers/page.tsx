import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

interface Sub { id: string; email: string; source?: string; status?: string; createdAt: string }

export default async function SubscribersPage() {
  let subs: Sub[] = [];
  try {
    const snap = await adminDb().collection("subscribers").orderBy("createdAt", "desc").limit(1000).get();
    subs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sub, "id">) }));
  } catch {
    /* collection may not exist yet */
  }

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Marketing</span>
          <h1 className="adm-h">Subscribers</h1>
          <p className="adm-sub">{subs.length} email subscribers</p>
        </div>
        {subs.length > 0 && <a className="adm-btn adm-btn--gold" href="/api/admin/subscribers/export">Export CSV</a>}
      </div>

      {subs.length === 0 ? (
        <div className="adm-card adm-muted">No subscribers yet.</div>
      ) : (
        <table className="adm-table">
          <thead><tr><th>Email</th><th>Source</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id}>
                <td data-label="Email">{s.email}</td>
                <td data-label="Source">{s.source ?? "—"}</td>
                <td data-label="Status"><span className={`adm-pill adm-pill--${s.status === "active" ? "active" : "inactive"}`}>{s.status ?? "active"}</span></td>
                <td data-label="Joined">{s.createdAt?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
