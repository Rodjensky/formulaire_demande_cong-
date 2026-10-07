/**
 * Simple in-memory sliding window rate limiter for public forms / API endpoints.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowSeconds = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = cache.get(key);

  if (!record || now > record.resetAt) {
    cache.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= maxRequests) {
    const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds,
  };
}
