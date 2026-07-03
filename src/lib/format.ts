// Client-safe formatting helpers (no server-only imports — usable in client
// components like ProductCard, cart, checkout).

/** Indian-grouped number, e.g. 29999 → "29,999". */
export const inr = (x: number) => Number(x || 0).toLocaleString("en-IN");
