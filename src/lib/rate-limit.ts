// Best-effort in-process rate limiter for public write endpoints.
// Suitable for a single Node.js server deployment. On serverless/multi-instance
// deployments the limit is per-instance, so database constraints and validation
// remain the authoritative protection.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically evict stale buckets so the map cannot grow unbounded.
let lastSweep = Date.now();
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (
      bucket.timestamps.length === 0 ||
      now - bucket.timestamps[bucket.timestamps.length - 1] > 600_000
    ) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Records a hit for `key` and reports whether it is within `limit` hits per
 * `windowMs`. Returns the seconds the caller should wait when limited.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  while (bucket.timestamps.length > 0 && now - bucket.timestamps[0] >= windowMs) {
    bucket.timestamps.shift();
  }

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Extracts a client identifier from a request for rate-limit bucketing. */
export function clientKey(request: Request, scope: string): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : 'unknown';
  return `${scope}:${ip}`;
}

/** Test helper: clears all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}
