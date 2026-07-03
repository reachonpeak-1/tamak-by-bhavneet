"use client";

import { useStore } from "./StoreProvider";

export default function Toast() {
  const { toastMsg } = useStore();
  return (
    <div className={`toast${toastMsg ? " show" : ""}`} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
      <span>{toastMsg ?? "Added to bag"}</span>
    </div>
  );
}
