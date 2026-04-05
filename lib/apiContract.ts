import { z } from "zod";

import { DATA_FORMAT_IDS } from "@/lib/formats";

export const CLIENT_SESSION_HEADER = "x-gridcraft-session";

export const RUN_RESPONSE_CODES = {
  ok: "OK",
  validation: "VALIDATION_ERROR",
  unsupportedFormat: "UNSUPPORTED_FORMAT",
  commandParse: "COMMAND_PARSE_ERROR",
  policyViolation: "POLICY_VIOLATION",
  engineFailure: "ENGINE_FAILURE",
  engineUnavailable: "ENGINE_UNAVAILABLE",
  timedOut: "TIMED_OUT",
  invalidJson: "INVALID_JSON",
  rateLimited: "RATE_LIMITED",
  unexpected: "UNEXPECTED_ERROR",
} as const;

export type RunResponseCode =
  (typeof RUN_RESPONSE_CODES)[keyof typeof RUN_RESPONSE_CODES];

export const runRequestSchema = z.object({
  input: z.string(),
  command: z.string(),
  inputFormat: z.enum(DATA_FORMAT_IDS),
  outputFormat: z.enum(DATA_FORMAT_IDS),
});

export const runResponseSchema = z.object({
  output: z.string(),
  error: z.string().nullable(),
  code: z.enum([
    RUN_RESPONSE_CODES.ok,
    RUN_RESPONSE_CODES.validation,
    RUN_RESPONSE_CODES.unsupportedFormat,
    RUN_RESPONSE_CODES.commandParse,
    RUN_RESPONSE_CODES.policyViolation,
    RUN_RESPONSE_CODES.engineFailure,
    RUN_RESPONSE_CODES.engineUnavailable,
    RUN_RESPONSE_CODES.timedOut,
    RUN_RESPONSE_CODES.invalidJson,
    RUN_RESPONSE_CODES.rateLimited,
    RUN_RESPONSE_CODES.unexpected,
  ]),
});

export type RunRequest = z.infer<typeof runRequestSchema>;
export type RunResponse = z.infer<typeof runResponseSchema>;
