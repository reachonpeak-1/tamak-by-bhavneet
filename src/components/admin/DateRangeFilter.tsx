"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Updates ?from=&to= for server-side date filtering. Wrap usages in <Suspense>.
export default function DateRangeFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const set = (key: string, val: string) => {
    const p = new URLSearchParams(sp.toString());
    if (val) p.set(key, val);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="adm-row">
      <label className="adm-field" style={{ marginBottom: 0 }}>
        <span>From</span>
        <input className="adm-in" type="date" defaultValue={sp.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} />
      </label>
      <label className="adm-field" style={{ marginBottom: 0 }}>
        <span>To</span>
        <input className="adm-in" type="date" defaultValue={sp.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} />
      </label>
    </div>
  );
}
