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

function isSensitiveLine(line: string) {
  if (!line) {
    return false;
  }

  return (
    STACK_TRACE_PATTERN.test(line) ||
    PATH_LINE_PATTERNS.some((pattern) => pattern.test(line))
  );
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

  if (!rawMessage.trim()) {
    return fallback;
  }

  const sanitizedMessage = simplifyKnownErrors(
    normalizeLines(rawMessage)
      .join("\n")
      .replace(/filename\s+\(stdin\)/gi, "input")
      .replace(/\bverb\b/gi, "operation")
      .replace(
        /Please use\s+"[^"]+"\s+for a list\./i,
        "Use the operations reference for available operations.",
      )
      .trim(),
  );

  if (!sanitizedMessage) {
    return fallback;
  }

  const [firstLine, secondLine] = sanitizedMessage.split("\n");

  if (!firstLine) {
    return fallback;
  }

  if (!secondLine) {
    return firstLine;
  }

  return `${firstLine} ${secondLine}`.trim();
}
