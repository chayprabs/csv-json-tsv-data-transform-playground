import {
  POLICY_BLOCKED_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "@/lib/millConstants";

const MAX_CLIENT_ERROR_LENGTH = 500;

/** PRD §16 — return verbatim when the API/client already used canonical copy. */
const PRESERVE_VERBATIM = new Set([
  RATE_LIMIT_MESSAGE,
  POLICY_BLOCKED_MESSAGE,
  "Please paste some data",
  "Please enter a transformation command",
  "Input exceeds the 10 MB limit",
  "Input is large and may be slow",
  "Command exceeds the 1000 character limit",
]);
const ENGINE_PREFIX_PATTERN = /^[a-z][a-z0-9-]{1,32}:\s*/i;
const STACK_TRACE_PATTERN = /^\s*at\s.+$/;
const PATH_LINE_PATTERNS = [
  /[A-Za-z]:\\/,
  /\/(?:Users|home|tmp|var|private|workspace)\//i,
  /webpack-internal:\/\//i,
  /\.next[\\/]/i,
  /node_modules[\\/]/i,
  /require stack:?/i,
];

const ENGINE_BINARY_TOKEN =
  process.env.ENGINE_BINARY_PATH?.trim() || "bin/transform-engine";

function isSensitiveLine(line: string) {
  if (!line) {
    return false;
  }

  return (
    STACK_TRACE_PATTERN.test(line) ||
    PATH_LINE_PATTERNS.some((pattern) => pattern.test(line))
  );
}

function stripEngineArtifacts(message: string) {
  let result = message;

  result = result.replace(/\bmlr\s+[\d.]+[^\n]*/gi, "");
  result = result.replace(/transform-engine(\.exe)?/gi, "engine");
  if (ENGINE_BINARY_TOKEN.length > 0) {
    result = result.replace(
      new RegExp(ENGINE_BINARY_TOKEN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      "engine",
    );
  }

  return result;
}

function normalizeLines(message: string) {
  return message
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(ENGINE_PREFIX_PATTERN, "").trim())
    .filter(Boolean)
    .filter((line) => !isSensitiveLine(line));
}

function simplifyKnownErrors(message: string) {
  const unknownOperationMatch = message.match(
    /operation\s+"([^"]+)"\s+not found/i,
  );

  if (unknownOperationMatch) {
    return `Unknown operation "${unknownOperationMatch[1]}".`;
  }

  const parseTokenMatch = message.match(/Parse error on token "([^"]+)"/i);

  if (/cannot parse DSL expression/i.test(message) && parseTokenMatch) {
    return `Couldn't parse that expression near "${parseTokenMatch[1]}".`;
  }

  if (/cannot parse DSL expression/i.test(message)) {
    return "Couldn't parse that expression. Check the syntax and try again.";
  }

  return message;
}

export function sanitizeErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";

  const trimmed = rawMessage.trim();

  if (!trimmed) {
    return fallback;
  }

  if (PRESERVE_VERBATIM.has(trimmed)) {
    return trimmed.length > MAX_CLIENT_ERROR_LENGTH
      ? `${trimmed.slice(0, MAX_CLIENT_ERROR_LENGTH - 1)}…`
      : trimmed;
  }

  const sanitizedMessage = simplifyKnownErrors(
    stripEngineArtifacts(
      normalizeLines(rawMessage)
        .join("\n")
        .replace(/filename\s+\(stdin\)/gi, "input")
        .replace(/\bverb\b/gi, "operation")
        .replace(
          /Please use\s+"[^"]+"\s+for a list\./i,
          "Use the operations reference for available operations.",
        )
        .trim(),
    ),
  );

  if (!sanitizedMessage) {
    return fallback;
  }

  const [firstLine, secondLine] = sanitizedMessage.split("\n");

  if (!firstLine) {
    return fallback;
  }

  let combined = !secondLine
    ? firstLine
    : `${firstLine} ${secondLine}`.trim();

  if (combined.length > MAX_CLIENT_ERROR_LENGTH) {
    combined = `${combined.slice(0, MAX_CLIENT_ERROR_LENGTH - 1)}…`;
  }

  return combined;
}
