import {
  CLIENT_SESSION_HEADER,
  RUN_RESPONSE_CODES,
  runResponseSchema,
  type RunResponse,
} from "@/lib/apiContract";
import type { DataFormatId } from "@/lib/formats";

export interface RunTransformRequest {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: DataFormatId;
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
          : `Request failed with status ${response.status}.`,
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
        error: responseText.trim() || `Request failed with status ${response.status}.`,
        code: RUN_RESPONSE_CODES.unexpected,
        status: response.status,
      };
    }

    const parsedResponse = runResponseSchema.safeParse(parsedJson);

    if (!parsedResponse.success) {
      return {
        output: "",
        error: responseText.trim() || `Request failed with status ${response.status}.`,
        code: RUN_RESPONSE_CODES.unexpected,
        status: response.status,
      };
    }

    return {
      ...parsedResponse.data,
      status: response.status,
    };
  } finally {
    timedAbort.dispose();
  }
}
