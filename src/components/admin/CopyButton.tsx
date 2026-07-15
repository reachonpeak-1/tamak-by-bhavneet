"use client";

import { useStore } from "@/components/StoreProvider";

/** Copies `value` to the clipboard — for pasting order data into a courier's site. */
export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { toast } = useStore();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`);
    } catch {
      toast("Could not copy — clipboard blocked");
    }
  }

  return (
    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm no-print" onClick={copy} title={`Copy ${label.toLowerCase()}`}>
      Copy
    </button>
  );
}
