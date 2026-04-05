export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_COMMAND_LENGTH = 2000;
export const MAX_SHARE_URL_LENGTH = 8_000;

interface ValidationOptions {
  input: string;
  command: string;
}

export type ValidationErrorCode =
  | "EMPTY_INPUT"
  | "EMPTY_COMMAND"
  | "INPUT_TOO_LARGE"
  | "COMMAND_TOO_LONG";

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

export function getInputSizeInBytes(input: string): number {
  return new TextEncoder().encode(input).length;
}

export function validateRunRequest({
  input,
  command,
}: ValidationOptions): ValidationError | null {
  if (!input.trim()) {
    return {
      code: "EMPTY_INPUT",
      message: "Paste some data to get started",
    };
  }

  if (!command.trim()) {
    return {
      code: "EMPTY_COMMAND",
      message: "Enter a transformation command",
    };
  }

  if (getInputSizeInBytes(input) > MAX_INPUT_BYTES) {
    return {
      code: "INPUT_TOO_LARGE",
      message: "Input is too large (max 10MB)",
    };
  }

  if (command.trim().length > MAX_COMMAND_LENGTH) {
    return {
      code: "COMMAND_TOO_LONG",
      message: "Command is too long",
    };
  }

  return null;
}
