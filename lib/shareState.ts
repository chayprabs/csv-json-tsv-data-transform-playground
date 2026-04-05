import { isDataFormatId, type DataFormatId } from "@/lib/formats";
import { MAX_SHARE_URL_LENGTH } from "@/lib/validation";

export interface SharedStudioState {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: DataFormatId;
}

interface SearchParamReader {
  get(name: string): string | null;
}

interface SerializedSharedStudioState {
  i: string;
  c: string;
  fi: DataFormatId;
  fo: DataFormatId;
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) =>
    String.fromCharCode(byte),
  ).join("");

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedValue =
    normalizedValue +
    "=".repeat((4 - (normalizedValue.length % 4 || 4)) % 4);
  const binary = atob(paddedValue);
  const bytes = Uint8Array.from(binary, (character) =>
    character.charCodeAt(0),
  );

  return new TextDecoder().decode(bytes);
}

function isSharedStudioState(value: unknown): value is SharedStudioState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SharedStudioState>;

  return (
    typeof candidate.input === "string" &&
    typeof candidate.command === "string" &&
    typeof candidate.inputFormat === "string" &&
    typeof candidate.outputFormat === "string" &&
    isDataFormatId(candidate.inputFormat) &&
    isDataFormatId(candidate.outputFormat)
  );
}

export function encodeSharedState(state: SharedStudioState): string {
  const serializedState: SerializedSharedStudioState = {
    i: state.input,
    c: state.command,
    fi: state.inputFormat,
    fo: state.outputFormat,
  };

  return encodeBase64Url(JSON.stringify(serializedState));
}

export function decodeSharedStateValue(
  encodedState: string | null | undefined,
): SharedStudioState | null {
  if (!encodedState) {
    return null;
  }

  try {
    const decodedState = JSON.parse(decodeBase64Url(encodedState)) as unknown;

    if (!decodedState || typeof decodedState !== "object") {
      return null;
    }

    const candidate = decodedState as Partial<SerializedSharedStudioState>;
    const normalizedState: SharedStudioState = {
      input: typeof candidate.i === "string" ? candidate.i : "",
      command: typeof candidate.c === "string" ? candidate.c : "",
      inputFormat: candidate.fi as DataFormatId,
      outputFormat: candidate.fo as DataFormatId,
    };

    return isSharedStudioState(normalizedState) ? normalizedState : null;
  } catch {
    return null;
  }
}

export function decodeSharedState(
  searchParams: SearchParamReader,
): SharedStudioState | null {
  return decodeSharedStateValue(searchParams.get("state"));
}

export function buildSharedStateUrl(
  pathname: string,
  state: SharedStudioState,
): string {
  const url = `${pathname}?state=${encodeSharedState(state)}`;

  if (url.length > MAX_SHARE_URL_LENGTH) {
    return pathname;
  }

  return url;
}
