export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const INPUT_WARNING_BYTES = 8 * 1024 * 1024;
export const MAX_COMMAND_LENGTH = 1000;
export const MAX_SHARE_URL_LENGTH = 32_000;

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
      message: "Please paste some data",
    };
  }

  if (!command.trim()) {
    return {
      code: "EMPTY_COMMAND",
      message: "Please enter a transformation command",
    };
  }

  if (getInputSizeInBytes(input) > MAX_INPUT_BYTES) {
    return {
      code: "INPUT_TOO_LARGE",
      message: "Input exceeds the 10 MB limit",
    };
  }

  if (command.trim().length > MAX_COMMAND_LENGTH) {
    return {
      code: "COMMAND_TOO_LONG",
      message: "Command exceeds the 1000 character limit",
    };
  }

  return null;
}

export function getInputLargeSlowWarning(input: string): string | null {
  const bytes = getInputSizeInBytes(input);
  if (bytes > INPUT_WARNING_BYTES && bytes <= MAX_INPUT_BYTES) {
    return "Input is large and may be slow";
  }

  return null;
}
