import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import { execa } from "execa";
import { NextRequest, NextResponse } from "next/server";

import {
  CLIENT_SESSION_HEADER,
  RUN_RESPONSE_CODES,
  runRequestSchema,
  type RunResponseCode,
} from "@/lib/apiContract";
import { normalizeCommandArgs } from "@/lib/commandCompatibility";
import { getCommandPolicyViolation } from "@/lib/commandPolicy";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getFormatById } from "@/lib/formats";
import { MAX_INPUT_BYTES, validateRunRequest } from "@/lib/validation";

export const runtime = "nodejs";

const FORBIDDEN_UNQUOTED_CHARACTERS = new Set(["|", "&", ";", "<", ">", "`"]);
const ENGINE_NAME = process.platform === "win32"
  ? "transform-engine.exe"
  : "transform-engine";
const MAX_EXECUTION_TIME_MS = 10_000;
const SESSION_LOCK_TTL_MS = MAX_EXECUTION_TIME_MS + 5_000;
const activeSessions = new Map<string, number>();

function getEngineBinaryPath() {
  return path.join(process.cwd(), "bin", ENGINE_NAME);
}

function createRunResponse({
  status,
  code,
  error,
  output = "",
}: {
  status: number;
  code: RunResponseCode;
  error: string | null;
  output?: string;
}) {
  return NextResponse.json(
    {
      output,
      error: error === null ? null : sanitizeErrorMessage(error),
      code,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function tokenizeCommand(command: string) {
  const trimmedCommand = command.trim();

  if (!trimmedCommand) {
    return [];
  }

  const tokens: string[] = [];
  let currentToken = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;

  for (const character of trimmedCommand) {
    if (quote === "'") {
      if (character === "'") {
        quote = null;
      } else {
        currentToken += character;
      }
      continue;
    }

    if (quote === '"') {
      if (escaping) {
        currentToken += character;
        escaping = false;
        continue;
      }

      if (character === "\\") {
        escaping = true;
        continue;
      }

      if (character === '"') {
        quote = null;
      } else {
        currentToken += character;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    if (FORBIDDEN_UNQUOTED_CHARACTERS.has(character)) {
      throw new Error(
        `Unsupported shell-style character "${character}" found outside quotes.`,
      );
    }

    if (/\s/.test(character)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
      continue;
    }

    currentToken += character;
  }

  if (quote !== null) {
    throw new Error("Command contains an unmatched quote.");
  }

  if (escaping) {
    throw new Error("Command ends with an unfinished escape sequence.");
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
}

function purgeExpiredSessionLocks() {
  const now = Date.now();

  activeSessions.forEach((startedAt, sessionId) => {
    if (now - startedAt > SESSION_LOCK_TTL_MS) {
      activeSessions.delete(sessionId);
    }
  });
}

function sanitizeSessionId(sessionId: string | null) {
  if (!sessionId) {
    return null;
  }

  if (sessionId.length > 128 || !/^[A-Za-z0-9-]+$/.test(sessionId)) {
    return null;
  }

  return sessionId;
}

function tryAcquireSessionLock(sessionId: string | null) {
  if (!sessionId) {
    return true;
  }

  purgeExpiredSessionLocks();

  if (activeSessions.has(sessionId)) {
    return false;
  }

  activeSessions.set(sessionId, Date.now());

  return true;
}

function releaseSessionLock(sessionId: string | null) {
  if (!sessionId) {
    return;
  }

  activeSessions.delete(sessionId);
}

async function ensureEngineIsAvailable() {
  const binaryPath = getEngineBinaryPath();

  try {
    await access(
      binaryPath,
      process.platform === "win32" ? fsConstants.F_OK : fsConstants.X_OK,
    );
    return binaryPath;
  } catch {
    return null;
  }
}

function getValidationStatus(validationCode: ReturnType<typeof validateRunRequest>) {
  if (!validationCode) {
    return 400;
  }

  switch (validationCode.code) {
    case "INPUT_TOO_LARGE":
      return 413;
    case "EMPTY_INPUT":
    case "EMPTY_COMMAND":
    case "COMMAND_TOO_LONG":
      return 400;
  }
}

export async function POST(request: NextRequest) {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return createRunResponse({
      status: 400,
      code: RUN_RESPONSE_CODES.invalidJson,
      error: "Request body must be valid JSON.",
    });
  }

  const parsedBody = runRequestSchema.safeParse(requestBody);

  if (!parsedBody.success) {
    return createRunResponse({
      status: 400,
      code: RUN_RESPONSE_CODES.validation,
      error:
        "Request body must include text input, command, and supported formats.",
    });
  }

  const payload = {
    ...parsedBody.data,
    command: parsedBody.data.command.trim(),
  };

  const validationError = validateRunRequest(payload);

  if (validationError) {
    return createRunResponse({
      status: getValidationStatus(validationError),
      code: RUN_RESPONSE_CODES.validation,
      error: validationError.message,
    });
  }

  if (Buffer.byteLength(payload.input, "utf8") > MAX_INPUT_BYTES) {
    return createRunResponse({
      status: 413,
      code: RUN_RESPONSE_CODES.validation,
      error: "Input is too large. The current limit is 10 MB.",
    });
  }

  let parsedArgs: string[];

  try {
    parsedArgs = normalizeCommandArgs(tokenizeCommand(payload.command));
  } catch (error) {
    return createRunResponse({
      status: 422,
      code: RUN_RESPONSE_CODES.commandParse,
      error: sanitizeErrorMessage(
        error,
        "Unable to parse the transformation command.",
      ),
    });
  }

  if (parsedArgs.length === 0) {
    return createRunResponse({
      status: 422,
      code: RUN_RESPONSE_CODES.commandParse,
      error: "No operation was found in the command.",
    });
  }

  const commandPolicyViolation = getCommandPolicyViolation(parsedArgs);

  if (commandPolicyViolation) {
    return createRunResponse({
      status: 403,
      code: RUN_RESPONSE_CODES.policyViolation,
      error: commandPolicyViolation,
    });
  }

  const sessionId = sanitizeSessionId(
    request.headers.get(CLIENT_SESSION_HEADER),
  );

  if (!tryAcquireSessionLock(sessionId)) {
    return createRunResponse({
      status: 429,
      code: RUN_RESPONSE_CODES.rateLimited,
      error:
        "Another transformation is already running for this workspace session. Wait for it to finish or cancel it first.",
    });
  }

  try {
    const binaryPath = await ensureEngineIsAvailable();

    if (!binaryPath) {
      return createRunResponse({
        status: 500,
        code: RUN_RESPONSE_CODES.engineUnavailable,
        error: "The transformation engine is unavailable on the server.",
      });
    }

    const result = await execa(
      binaryPath,
      [
        getFormatById(payload.inputFormat).inputFlag,
        getFormatById(payload.outputFormat).outputFlag,
        ...parsedArgs,
      ],
      {
        input: payload.input,
        reject: false,
        cancelSignal: request.signal,
        stripFinalNewline: false,
        timeout: MAX_EXECUTION_TIME_MS,
        windowsHide: true,
      },
    );

    if (result.exitCode !== 0) {
      return createRunResponse({
        status: 422,
        code: RUN_RESPONSE_CODES.engineFailure,
        error: sanitizeErrorMessage(
          result.stderr || `Process exited with code ${result.exitCode}.`,
          "The transformation failed.",
        ),
        output: result.stdout,
      });
    }

    return createRunResponse({
      status: 200,
      code: RUN_RESPONSE_CODES.ok,
      error: null,
      output: result.stdout,
    });
  } catch (error) {
    if (request.signal.aborted) {
      return createRunResponse({
        status: 499,
        code: RUN_RESPONSE_CODES.unexpected,
        error: "The request was cancelled before the transformation completed.",
      });
    }

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("timed out")
    ) {
      return createRunResponse({
        status: 504,
        code: RUN_RESPONSE_CODES.timedOut,
        error: "The transformation timed out after 10 seconds.",
      });
    }

    return createRunResponse({
      status: 500,
      code: RUN_RESPONSE_CODES.unexpected,
      error: "Unexpected execution failure.",
    });
  } finally {
    releaseSessionLock(sessionId);
  }
}
