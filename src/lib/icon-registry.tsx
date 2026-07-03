import type { ReactNode } from "react";

// Maps a content `icon` key → an inline SVG. CMS editors pick keys; SVGs never
// live in Firestore. Unknown keys render nothing.
export const ICONS: Record<string, ReactNode> = {
  truck: <svg viewBox="0 0 24 24"><path d="M3 6h11v9H3z" /><path d="M14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17.5" cy="18" r="1.7" /></svg>,
  card: <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10.5h18" /><circle cx="16.5" cy="15" r="1.4" /></svg>,
  return: <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 4v5h-5" /></svg>,
  ruler: <svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="1" /><path d="M7 8v3M11 8v4.5M15 8v3M19 8v4.5" /></svg>,
  loom: <svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" /><path d="M7 4v16M17 4v16" opacity=".5" /></svg>,
  measure: <svg viewBox="0 0 24 24"><path d="M12 3v18M5 8l7-5 7 5M5 8v8l7 5 7-5V8" /></svg>,
  globe: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>,
  instagram: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
  facebook: <svg viewBox="0 0 24 24"><path d="M14 8h2V5h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V8.5c0-.3.2-.5.5-.5z" /></svg>,
  pinterest: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7c-2.5 0-4 1.6-4 3.6 0 1 .5 2 1.3 2.3.2 0 .3 0 .3-.2l.2-.7c0-.2 0-.3-.1-.4-.3-.4-.5-.8-.5-1.4 0-1.4 1-2.4 2.5-2.4 1.4 0 2.2.8 2.2 2 0 1.5-.7 2.8-1.6 2.8-.5 0-.9-.4-.8-1l.4-1.6c.1-.5 0-1-.5-1-.5 0-1 .6-1 1.4 0 .5.2.8.2.8l-.7 3c-.2.9 0 2 0 2.1 0 .1.1.1.2 0 .1-.1.8-1 1-1.9l.4-1.4c.2.4.8.7 1.4.7 1.9 0 3.2-1.7 3.2-4 0-1.8-1.5-3.5-3.9-3.5z" fill="currentColor" stroke="none" /></svg>,
  youtube: <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" /></svg>,
};

export const ICON_KEYS = Object.keys(ICONS);
export const Icon = ({ name }: { name?: string }) => <>{(name && ICONS[name]) || null}</>;
