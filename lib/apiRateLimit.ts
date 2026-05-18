const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil(
      (WINDOW_MS - (now - record.windowStart)) / 1000,
    );
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export function pruneStaleRateLimitEntries() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now - record.windowStart > WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(pruneStaleRateLimitEntries, 5 * 60_000);
}

/** PRD §11.1 — x-forwarded-for (first IP), then request.ip, then x-real-ip. */
export function getClientIpFromRequest(
  forwardedFor: string | null,
  requestIp: string | null | undefined,
  realIp: string | null,
): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  if (requestIp?.trim()) {
    return requestIp.trim();
  }

  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "127.0.0.1";
}
