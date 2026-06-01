import {
  CLIENT_SESSION_HEADER,
  RUN_RESPONSE_CODES,
  runResponseSchema,
  type RunResponse,
} from "@/lib/apiContract";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import type { DataFormatId, OutputFormatId } from "@/lib/formats";
import {
  INPUT_EXCEEDS_LIMIT_MESSAGE,
  RATE_LIMIT_MESSAGE,
  REQUEST_CANCELLED_MESSAGE,
  TRANSFORMATION_TIMEOUT_MESSAGE,
} from "@/lib/millConstants";

export interface RunTransformRequest {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: OutputFormatId;
}

export interface RunTransformOptions {
  signal?: AbortSignal;
  sessionId: string;
}

export interface RunTransformResponse extends RunResponse {
  status: number;
}

const CLIENT_REQUEST_TIMEOUT_MS = 15_000;

function createTimedAbortSignal(externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new Error("The request timed out on the client."));
  }, CLIENT_REQUEST_TIMEOUT_MS);

  const abortFromExternalSignal = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternalSignal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    dispose() {
      window.clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", abortFromExternalSignal);
      }
    },
  };
}

function fallbackMessageForHttpStatus(status: number): string | null {
  switch (status) {
    case 413:
      return INPUT_EXCEEDS_LIMIT_MESSAGE;
    case 429:
      return RATE_LIMIT_MESSAGE;
    case 499:
      return REQUEST_CANCELLED_MESSAGE;
    case 500:
      return "The server could not complete this request. Try again.";
    case 502:
    case 503:
      return "The service is temporarily unavailable. Try again in a moment.";
    case 504:
      return TRANSFORMATION_TIMEOUT_MESSAGE;
    default:
      return null;
  }
}

function resolveHttpErrorBody(status: number, responseText: string): string {
  const trimmed = responseText.trim();
  const fallback = fallbackMessageForHttpStatus(status);

  if (!trimmed) {
    return fallback ?? sanitizeErrorMessage(`Request failed with status ${status}.`);
  }

  const sanitized = sanitizeErrorMessage(trimmed);

  if (!sanitized || sanitized === "Something went wrong.") {
    return fallback ?? sanitized;
  }

  return sanitized;
}

export async function runTransform(
  payload: RunTransformRequest,
  options: RunTransformOptions,
): Promise<RunTransformResponse> {
  const timedAbort = createTimedAbortSignal(options.signal);

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [CLIENT_SESSION_HEADER]: options.sessionId,
      },
      cache: "no-store",
      body: JSON.stringify(payload),
      signal: timedAbort.signal,
    });

    const responseText = await response.text();

    if (!responseText) {
      return {
        output: "",
        error: response.ok
          ? null
          : resolveHttpErrorBody(response.status, ""),
        code: response.ok
          ? RUN_RESPONSE_CODES.ok
          : RUN_RESPONSE_CODES.unexpected,
        status: response.status,
      };
    }

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(responseText) as unknown;
    } catch {
      return {
        output: "",
        error: resolveHttpErrorBody(response.status, responseText),
        code: RUN_RESPONSE_CODES.unexpected,
        status: response.status,
      };
    }

    const parsedResponse = runResponseSchema.safeParse(parsedJson);

    if (!parsedResponse.success) {
      return {
        output: "",
        error: resolveHttpErrorBody(response.status, responseText),
        code: RUN_RESPONSE_CODES.unexpected,
        status: response.status,
      };
    }

    const data = parsedResponse.data;

    return {
      ...data,
      error: data.error ? sanitizeErrorMessage(data.error) : null,
      status: response.status,
    };
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    if (timedAbort.signal.aborted) {
      throw new Error(
        "The request took too long waiting for the server. Try again, or reduce input size.",
      );
    }

    if (error instanceof TypeError) {
      const message = error.message.toLowerCase();
      if (
        message.includes("fetch") ||
        message.includes("failed") ||
        message.includes("network") ||
        message.includes("load failed")
      ) {
        throw new Error(
          "Unable to reach the server. Check your network connection and try again.",
        );
      }
    }

    throw new Error(
      sanitizeErrorMessage(error, "Unexpected request failure."),
    );
  } finally {
    timedAbort.dispose();
  }
}
