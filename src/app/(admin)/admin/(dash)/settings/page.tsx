import { getSettings } from "@/lib/data/settings";
import SettingsEditor from "@/components/admin/SettingsEditor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Configuration</span>
          <h1 className="adm-h">Settings</h1>
          <p className="adm-sub">Store details, checkout, shipping and tax. Affects the live checkout immediately.</p>
        </div>
      </div>
      <SettingsEditor initial={settings} />
    </>
  );
}
