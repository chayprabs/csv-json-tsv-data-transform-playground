const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export function checkRateLimit(rateLimitKey: string): {
  allowed: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(rateLimitKey);

  if (!record || now - record.windowStart > WINDOW_MS) {
    rateLimitMap.set(rateLimitKey, { count: 1, windowStart: now });
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

export function buildRateLimitKey(ip: string, sessionId: string | null): string {
  const session = sessionId?.trim() || "anonymous";
  return `${ip}:${session}`;
}

export function pruneStaleRateLimitEntries() {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now - record.windowStart > WINDOW_MS * 2) {
      rateLimitMap.delete(key);
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
