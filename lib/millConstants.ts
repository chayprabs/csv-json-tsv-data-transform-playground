/** PRD §16 — large input warning (8–10 MB) */
export const INPUT_LARGE_SLOW_MESSAGE = "Input is large and may be slow";

/** PRD §16 / §13.4 — policy-blocked execution */
export const POLICY_BLOCKED_MESSAGE =
  "This operation is not available in the workspace.";

/** PRD §11.1 — rate limit response body */
export const RATE_LIMIT_MESSAGE =
  "Too many requests. Please wait a moment.";

/** PRD §9 — oversized input / body gate (client + server) */
export const INPUT_EXCEEDS_LIMIT_MESSAGE = "Input exceeds the 10 MB limit";

/** PRD §9 — engine / gateway timeout */
export const TRANSFORMATION_TIMEOUT_MESSAGE =
  "The transformation timed out after 10 seconds.";

/** PRD §9 — aborted request */
export const REQUEST_CANCELLED_MESSAGE =
  "The request was cancelled before the transformation completed.";

/** Engine missing or misconfigured (API 500) */
export const ENGINE_UNAVAILABLE_MESSAGE =
  "The transformation engine is unavailable on the server.";
