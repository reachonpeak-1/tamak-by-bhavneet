import "server-only";

// Dependency-free fixed-window rate limiter. In-memory and therefore
// PER-INSTANCE — on serverless it limits each warm instance independently, so
// it blunts spam/brute-force rather than enforcing a hard global cap. For a
// strict global limit, back this with a shared store (e.g. Upstash Redis).

interface Bucket {
  count: number;
  reset: number;
}

const buckets = new Map<string, Bucket>();

// Occasionally evict expired buckets so the map can't grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Returns true if the caller is WITHIN the limit (allowed), false if the
 * window is exhausted. `key` should scope the limit (e.g. "newsletter:<ip>").
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Convenience: limit by route + client IP. Returns true when allowed. */
export function allow(req: Request, route: string, limit: number, windowMs: number): boolean {
  return rateLimit(`${route}:${clientIp(req)}`, limit, windowMs);
}
