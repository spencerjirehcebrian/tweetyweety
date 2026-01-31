import { kv } from "@vercel/kv";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

const DEFAULT_LIMIT = parseInt(process.env.RATE_LIMIT_MAX ?? "30", 10);
const DEFAULT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_SECONDS ?? "60",
  10
);

export async function checkRateLimit(
  ip: string,
  limit: number = DEFAULT_LIMIT,
  windowSeconds: number = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  const key = `rate:${ip}`;

  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, windowSeconds);
  }

  const ttl = await kv.ttl(key);
  const resetInSeconds = ttl > 0 ? ttl : windowSeconds;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetInSeconds,
  };
}
