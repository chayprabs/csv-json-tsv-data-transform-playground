import type { DataFormatId } from "@/lib/formats";

const MAX_OUTPUT_PREVIEW_LINES = 2000;
const MAX_OUTPUT_PREVIEW_CHARACTERS = 200_000;
const DOUBLE_QUOTE = '"';

function getNonEmptyLines(value: string): string[] {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.length > 0);
}

function countDelimitedRows(value: string): number {
  let rowCount = 0;
  let seenAnyContent = false;
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? "";
    const nextCharacter = value[index + 1] ?? "";

    if (character === DOUBLE_QUOTE) {
      if (inQuotes && nextCharacter === DOUBLE_QUOTE) {
        index += 1;
        seenAnyContent = true;
        continue;
      }

      inQuotes = !inQuotes;
      seenAnyContent = true;
      continue;
    }

    if (!inQuotes && character === "\r" && nextCharacter === "\n") {
      rowCount += 1;
      seenAnyContent = false;
      index += 1;
      continue;
    }

    if (!inQuotes && character === "\n") {
      rowCount += 1;
      seenAnyContent = false;
      continue;
    }

    if (character.trim().length > 0) {
      seenAnyContent = true;
    }
  }

  if (seenAnyContent) {
    rowCount += 1;
  }

  return Math.max(rowCount - 1, 0);
}

export function countRowsForFormat(
  value: string,
  format: DataFormatId,
): number {
  if (!value.trim()) {
    return 0;
  }

  if (format === "json") {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.length;
      }

      return parsed !== null && typeof parsed === "object" ? 1 : 0;
    } catch {
      return getNonEmptyLines(value).length;
    }
  }

  if (format === "csv" || format === "tsv") {
    return countDelimitedRows(value);
  }

  return getNonEmptyLines(value).length;
}

export interface OutputPreviewResult {
  preview: string;
  isTruncated: boolean;
}

export function createOutputPreview(output: string): OutputPreviewResult {
  if (!output) {
    return {
      preview: "",
      isTruncated: false,
    };
  }

  const normalizedOutput = output.replace(/\r\n/g, "\n");
  let lineCount = 1;
  let previewLength = normalizedOutput.length;
  let isTruncated = false;

  for (let index = 0; index < normalizedOutput.length; index += 1) {
    if (normalizedOutput[index] === "\n") {
      lineCount += 1;
    }

    if (
      lineCount > MAX_OUTPUT_PREVIEW_LINES ||
      index + 1 > MAX_OUTPUT_PREVIEW_CHARACTERS
    ) {
      previewLength = index;
      isTruncated = true;
      break;
    }
  }

  const preview = normalizedOutput.slice(0, previewLength).trimEnd();

  return {
    preview,
    isTruncated,
  };
}
