import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";

import { execa } from "execa";
import { NextRequest, NextResponse } from "next/server";

import {
  RUN_RESPONSE_CODES,
  runRequestSchema,
  type RunResponseCode,
} from "@/lib/apiContract";
import { checkRateLimit, getClientIpFromRequest } from "@/lib/apiRateLimit";
import { normalizeCommandArgs } from "@/lib/commandCompatibility";
import { getCommandPolicyViolation } from "@/lib/commandPolicy";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getFormatById, getOutputFormatById } from "@/lib/formats";
import { RATE_LIMIT_MESSAGE } from "@/lib/millConstants";
import { countRowsForFormat } from "@/lib/runMetrics";
import {
  getCachedRunResult,
  getRunResultCacheKey,
  setCachedRunResult,
} from "@/lib/runResponseCache";
import { MAX_INPUT_BYTES, validateRunRequest } from "@/lib/validation";

export const runtime = "nodejs";

const FORBIDDEN_UNQUOTED_CHARACTERS = new Set(["|", "&", ";", "<", ">", "`"]);
const ENGINE_NAME = process.platform === "win32"
  ? "transform-engine.exe"
  : "transform-engine";
const MAX_EXECUTION_TIME_MS = 10_000;
const MAX_REQUEST_BODY_BYTES = MAX_INPUT_BYTES + 64 * 1024;

class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "RequestBodyTooLargeError";
  }
}

function getEngineBinaryPath() {
  return path.join(process.cwd(), "bin", ENGINE_NAME);
}

function createRunResponse({
  status,
  code,
  error,
  output = "",
  inputRowCount,
  outputRowCount,
  durationMs,
  headers: extraHeaders,
}: {
  status: number;
  code: RunResponseCode;
  error: string | null;
  output?: string;
  inputRowCount?: number;
  outputRowCount?: number;
  durationMs?: number;
  headers?: Record<string, string>;
}) {
  const body: Record<string, unknown> = {
    output,
    error: error === null ? null : sanitizeErrorMessage(error),
    code,
  };

  if (inputRowCount !== undefined) {
    body.inputRowCount = inputRowCount;
  }

  if (outputRowCount !== undefined) {
    body.outputRowCount = outputRowCount;
  }

  if (durationMs !== undefined) {
    body.durationMs = durationMs;
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
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

function concatenateChunks(chunks: Uint8Array[], totalBytes: number) {
  const buffer = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return buffer;
}

async function readRequestBodyWithLimit(request: NextRequest) {
  const contentLengthHeader = request.headers.get("content-length");
  const declaredContentLength = contentLengthHeader
    ? Number.parseInt(contentLengthHeader, 10)
    : Number.NaN;

  if (
    Number.isFinite(declaredContentLength) &&
    declaredContentLength > MAX_REQUEST_BODY_BYTES
  ) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    totalBytes += value.length;

    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      throw new RequestBodyTooLargeError();
    }

    chunks.push(value);
  }

  return new TextDecoder().decode(concatenateChunks(chunks, totalBytes));
}

export async function POST(request: NextRequest) {
  let requestBody: unknown;
  let requestText: string;

  try {
    requestText = await readRequestBodyWithLimit(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return createRunResponse({
        status: 413,
        code: RUN_RESPONSE_CODES.validation,
        error: "Input exceeds the 10 MB limit",
      });
    }

    return createRunResponse({
      status: 400,
      code: RUN_RESPONSE_CODES.invalidJson,
      error: "Request body must be valid JSON.",
    });
  }

  try {
    requestBody = JSON.parse(requestText) as unknown;
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
      error: "Input exceeds the 10 MB limit",
    });
  }

  const clientIp = getClientIpFromRequest(
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
  const rate = checkRateLimit(clientIp);

  if (!rate.allowed) {
    return createRunResponse({
      status: 429,
      code: RUN_RESPONSE_CODES.rateLimited,
      error: RATE_LIMIT_MESSAGE,
      headers: {
        "Retry-After": String(rate.retryAfter),
      },
    });
  }

  const cacheKey = getRunResultCacheKey(payload);
  const cached = getCachedRunResult(cacheKey);

  if (cached) {
    return createRunResponse({
      status: 200,
      code: RUN_RESPONSE_CODES.ok,
      error: null,
      output: cached.output,
      inputRowCount: cached.inputRowCount,
      outputRowCount: cached.outputRowCount,
      durationMs: cached.durationMs,
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

  const commandPolicyViolation = getCommandPolicyViolation(
    parsedArgs,
    payload.command,
  );

  if (commandPolicyViolation) {
    return createRunResponse({
      status: 400,
      code: RUN_RESPONSE_CODES.policyViolation,
      error: commandPolicyViolation,
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

    const startedAt = Date.now();

    const result = await execa(
      binaryPath,
      [
        getFormatById(payload.inputFormat).inputFlag,
        getOutputFormatById(payload.outputFormat).outputFlag,
        ...parsedArgs,
      ],
      {
        input: payload.input,
        reject: false,
        cancelSignal: request.signal,
        stripFinalNewline: false,
        timeout: MAX_EXECUTION_TIME_MS,
        windowsHide: true,
        env: {},
      },
    );

    const durationMs = Math.max(0, Date.now() - startedAt);
    const inputRowCount = countRowsForFormat(payload.input, payload.inputFormat);
    const outputRowCount = countRowsForFormat(
      result.stdout,
      payload.outputFormat,
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

    setCachedRunResult(cacheKey, {
      output: result.stdout,
      inputRowCount,
      outputRowCount,
      durationMs,
    });

    return createRunResponse({
      status: 200,
      code: RUN_RESPONSE_CODES.ok,
      error: null,
      output: result.stdout,
      inputRowCount,
      outputRowCount,
      durationMs,
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
  }
}
