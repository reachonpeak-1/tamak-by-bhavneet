"use client";

import { useEffect, useRef, useState } from "react";

const PREFIX = "tamak.draft.";

/**
 * Mirrors editable form state into localStorage so in-progress admin edits survive
 * a network failure, accidental tab close, or reload. Mirrors the cart persistence
 * pattern in StoreProvider.tsx (try/catch-guarded, tamak.* keyed, useEffect-only so
 * it is SSR-safe).
 *
 * Usage: const { pending, hasDraft, dismiss, clear } = useDraft(key, state);
 *  - hasDraft → render a Restore/Discard banner.
 *  - Restore  → apply `pending` to your state, then call dismiss().
 *  - Discard  → clear().
 *  - On a successful save → clear().
 */
export function useDraft<T>(
  key: string,
  live: T,
  opts: { enabled?: boolean; debounceMs?: number; warnOnClose?: boolean } = {},
) {
  const { enabled = true, debounceMs = 600, warnOnClose = false } = opts;
  const storageKey = PREFIX + key;
  const [pending, setPending] = useState<T | null>(null); // leftover draft found on mount
  const [ready, setReady] = useState(false);
  const blocked = useRef(true); // suppress writes until mount-check + any pending draft resolved
  const dirty = useRef(false);

  // on mount: look for an existing draft; if none, unblock autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPending(JSON.parse(raw) as T);
      else blocked.current = false;
    } catch {
      blocked.current = false;
    }
    setReady(true);
  }, [storageKey]);

  // debounced autosave whenever live state changes (once unblocked)
  useEffect(() => {
    if (!enabled || !ready || blocked.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(live));
        dirty.current = true;
      } catch {}
    }, debounceMs);
    return () => clearTimeout(t);
  }, [live, enabled, ready, storageKey, debounceMs]);

  // optional: warn before an accidental tab close while a draft is being kept
  useEffect(() => {
    if (!warnOnClose) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [warnOnClose]);

  // keep draft, start autosaving (called after the admin restores or fresh-edits)
  const dismiss = () => {
    blocked.current = false;
    setPending(null);
  };
  // remove the draft entirely (discard, or after a successful save)
  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    dirty.current = false;
    dismiss();
  };

  return { pending, hasDraft: pending != null, dismiss, clear };
}
