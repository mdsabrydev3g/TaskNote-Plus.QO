// Fixed-window rate limiter, in-memory per instance.
// On Vercel serverless this is per-instance — acceptable for MVP abuse
// protection; document as [!] in README (multi-instance needs Redis later, §16.6).

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, retryAfterSec: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}

export const LIMITS = {
  auth: { limit: 8, windowMs: 60_000 },        // login/signup — strict (§10.2)
  aiLike: { limit: 20, windowMs: 60_000 },     // quick-add / search
  write: { limit: 120, windowMs: 60_000 },
  read: { limit: 300, windowMs: 60_000 },
} as const;
