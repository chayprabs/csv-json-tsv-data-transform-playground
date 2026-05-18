import { POLICY_BLOCKED_MESSAGE } from "@/lib/millConstants";

const UNSUPPORTED_OPERATION_REASONS: Record<string, string> = {
  join:
    "This operation requires additional server-side files, which this workspace does not expose.",
  split:
    "This operation writes side-output files, which this workspace does not allow.",
  tee: "This operation writes side-output files or pipes, which this workspace does not allow.",
  template:
    "This operation requires a server-side template file, which this workspace does not expose.",
};

const BLOCKED_DSL_FUNCTIONS = ["exec", "stat", "system"] as const;

function findBlockedDslFunction(expression: string): string | null {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaping = false;

  for (let index = 0; index < expression.length; index += 1) {
    const character = expression[index];

    if (inSingleQuote) {
      if (character === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (character === "\\") {
        escaping = true;
        continue;
      }

      if (character === '"') {
        inDoubleQuote = false;
      }

      continue;
    }

    if (character === "'") {
      inSingleQuote = true;
      continue;
    }

    if (character === '"') {
      inDoubleQuote = true;
      continue;
    }

    const remainingExpression = expression.slice(index).toLowerCase();

    for (const functionName of BLOCKED_DSL_FUNCTIONS) {
      if (!remainingExpression.startsWith(functionName)) {
        continue;
      }

      const beforeCharacter = index === 0 ? "" : (expression[index - 1] ?? "");

      if (/[A-Za-z0-9_]/.test(beforeCharacter)) {
        continue;
      }

      let cursor = index + functionName.length;

      while (cursor < expression.length && /\s/.test(expression[cursor] ?? "")) {
        cursor += 1;
      }

      if (expression[cursor] === "(") {
        return functionName;
      }
    }
  }

  return null;
}

function splitCommandSegments(parsedArgs: string[]): string[][] {
  const segments: string[][] = [];
  let currentSegment: string[] = [];

  for (const token of parsedArgs) {
    if (token === "then") {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      currentSegment = [];
      continue;
    }

    currentSegment.push(token);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

function tokenLooksLikeFilePath(token: string): boolean {
  if (
    token === "~" ||
    token.startsWith("~/") ||
    token.startsWith("./") ||
    token.includes("../")
  ) {
    return true;
  }

  if (/^[A-Za-z]:\\/.test(token)) {
    return true;
  }

  if (token.startsWith("/") && token.length > 1) {
    return true;
  }

  return false;
}

function commandContainsTeeVerb(command: string): boolean {
  return /\btee\b/i.test(command);
}

export function getUnsupportedOperationReason(operation: string): string | null {
  return UNSUPPORTED_OPERATION_REASONS[operation] ?? null;
}

export function getCommandPolicyViolation(
  parsedArgs: string[],
  rawCommand: string,
): string | null {
  if (commandContainsTeeVerb(rawCommand)) {
    return POLICY_BLOCKED_MESSAGE;
  }

  for (const token of parsedArgs) {
    if (token === "--from") {
      return POLICY_BLOCKED_MESSAGE;
    }

    if (tokenLooksLikeFilePath(token)) {
      return POLICY_BLOCKED_MESSAGE;
    }

    const blockedFunctionName = findBlockedDslFunction(token);

    if (blockedFunctionName) {
      return POLICY_BLOCKED_MESSAGE;
    }
  }

  const segments = splitCommandSegments(parsedArgs);

  for (const segment of segments) {
    const operation = segment[0];

    if (!operation) {
      continue;
    }
    const unsupportedOperationReason =
      getUnsupportedOperationReason(operation);

    if (unsupportedOperationReason) {
      return POLICY_BLOCKED_MESSAGE;
    }
  }

  return null;
}
