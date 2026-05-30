import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

import {
  coerceOutputFormat,
  isDataFormatId,
  isOutputFormatId,
  type DataFormatId,
  type OutputFormatId,
} from "@/lib/formats";
import { MAX_SHARE_URL_LENGTH } from "@/lib/validation";

export interface SharedStudioState {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: OutputFormatId;
}

interface SearchParamReader {
  get(name: string): string | null;
}

interface SerializedSharedStudioState {
  i: string;
  c: string;
  fi: DataFormatId;
  fo: OutputFormatId;
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
    isOutputFormatId(candidate.outputFormat)
  );
}

function normalizeDecodedState(
  candidate: Partial<SerializedSharedStudioState>,
): SharedStudioState | null {
  const fiRaw = typeof candidate.fi === "string" ? candidate.fi : "csv";
  const normalizedState: SharedStudioState = {
    input: typeof candidate.i === "string" ? candidate.i : "",
    command: typeof candidate.c === "string" ? candidate.c : "",
    inputFormat: isDataFormatId(fiRaw) ? fiRaw : "csv",
    outputFormat: coerceOutputFormat(
      typeof candidate.fo === "string" ? candidate.fo : "csv",
    ),
  };

  return isSharedStudioState(normalizedState) ? normalizedState : null;
}

function parseSerializedJson(jsonText: string): SharedStudioState | null {
  try {
    const decodedState = JSON.parse(jsonText) as unknown;

    if (!decodedState || typeof decodedState !== "object") {
      return null;
    }

    return normalizeDecodedState(
      decodedState as Partial<SerializedSharedStudioState>,
    );
  } catch {
    return null;
  }
}

export function encodeSharedState(state: SharedStudioState): string {
  const serializedState: SerializedSharedStudioState = {
    i: state.input,
    c: state.command,
    fi: state.inputFormat,
    fo: state.outputFormat,
  };

  const jsonPayload = JSON.stringify(serializedState);
  return compressToEncodedURIComponent(jsonPayload);
}

export function decodeSharedStateValue(
  encodedState: string | null | undefined,
): SharedStudioState | null {
  if (!encodedState) {
    return null;
  }

  const lzDecoded = decompressFromEncodedURIComponent(encodedState);
  if (lzDecoded) {
    const fromLz = parseSerializedJson(lzDecoded);
    if (fromLz) {
      return fromLz;
    }
  }

  try {
    const legacyJson = decodeBase64Url(encodedState);
    return parseSerializedJson(legacyJson);
  } catch {
    return null;
  }
}

export function decodeSharedState(
  searchParams: SearchParamReader,
): SharedStudioState | null {
  return decodeSharedStateValue(searchParams.get("state"));
}

export function isSharedStateUrlTooLong(state: SharedStudioState): boolean {
  return `${"/"}?state=${encodeSharedState(state)}`.length > MAX_SHARE_URL_LENGTH;
}

export function buildSharedStateUrl(
  pathname: string,
  state: SharedStudioState,
): string | null {
  const url = `${pathname}?state=${encodeSharedState(state)}`;

  if (url.length > MAX_SHARE_URL_LENGTH) {
    return null;
  }

  return url;
}
