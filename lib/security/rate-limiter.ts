/**
 * In-memory sliding window rate limiter for authentication routes.
 * Keys by client IP address and target account identifier.
 * Source: docs/rate-limiting.md
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  clientIp: string;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 5, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const record = rateLimitStore.get(key) ?? { timestamps: [] };
  // Filter out timestamps outside the active sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldest = activeTimestamps[0] ?? now;
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetSeconds,
      clientIp: key,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - activeTimestamps.length,
    resetSeconds: config.windowSeconds,
    clientIp: key,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

