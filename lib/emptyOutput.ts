import type { DataFormatId } from "@/lib/formats";

interface EmptyOutputFallbackOptions {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: DataFormatId;
}

function parseDelimitedHeader(input: string, delimiter: string) {
  const firstLine = input.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";

  if (!firstLine) {
    return [];
  }

  return firstLine.split(delimiter).map((header) => header.trim());
}

function parseJsonHeaders(input: string) {
  try {
    const parsed = JSON.parse(input) as unknown;

    if (Array.isArray(parsed)) {
      const firstObject = parsed.find(
        (value): value is Record<string, unknown> =>
          value !== null && typeof value === "object" && !Array.isArray(value),
      );

      return firstObject ? Object.keys(firstObject) : [];
    }

    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.keys(parsed);
    }
  } catch {
    return [];
  }

  return [];
}

function parseNdjsonHeaders(input: string) {
  const firstLine = input
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .find((line) => line.trim().length > 0);

  if (!firstLine) {
    return [];
  }

  try {
    const parsed = JSON.parse(firstLine) as unknown;

    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.keys(parsed);
    }
  } catch {
    return [];
  }

  return [];
}

function getBaseHeaders(input: string, inputFormat: DataFormatId) {
  switch (inputFormat) {
    case "csv":
      return parseDelimitedHeader(input, ",");
    case "tsv":
      return parseDelimitedHeader(input, "\t");
    case "json":
      return parseJsonHeaders(input);
    case "ndjson":
      return parseNdjsonHeaders(input);
    case "dkvp":
      return [];
  }
}

function applyHeaderTransformations(headers: string[], command: string) {
  const segments = command
    .split(/\bthen\b/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let currentHeaders = [...headers];

  for (const segment of segments) {
    const cutMatch = segment.match(/^cut\s+-f\s+([^\s]+)$/i);
    if (cutMatch) {
      currentHeaders = (cutMatch[1] ?? "")
        .split(",")
        .map((fieldName) => fieldName.trim())
        .filter(Boolean);
      continue;
    }

    const reorderMatch = segment.match(/^reorder\s+-f\s+([^\s]+)$/i);
    if (reorderMatch) {
      currentHeaders = (reorderMatch[1] ?? "")
        .split(",")
        .map((fieldName) => fieldName.trim())
        .filter(Boolean);
      continue;
    }

    const labelMatch = segment.match(/^label\s+(.+)$/i);
    if (labelMatch) {
      currentHeaders = (labelMatch[1] ?? "")
        .split(",")
        .map((fieldName) => fieldName.trim())
        .filter(Boolean);
      continue;
    }

    const renameMatch = segment.match(/^rename\s+(.+)$/i);
    if (renameMatch) {
      const renameParts = (renameMatch[1] ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      for (let index = 0; index < renameParts.length - 1; index += 2) {
        const from = renameParts[index];
        const to = renameParts[index + 1];

        if (!from || !to) {
          continue;
        }

        currentHeaders = currentHeaders.map((header) =>
          header === from ? to : header,
        );
      }
    }

    const assignmentMatches = segment.matchAll(
      /\$([A-Za-z_][A-Za-z0-9_]*)\s*=/g,
    );

    for (const match of assignmentMatches) {
      const fieldName = match[1];

      if (fieldName && !currentHeaders.includes(fieldName)) {
        currentHeaders.push(fieldName);
      }
    }
  }

  return currentHeaders;
}

export function deriveEmptyOutputFallback({
  input,
  command,
  inputFormat,
  outputFormat,
}: EmptyOutputFallbackOptions) {
  if (outputFormat === "json") {
    return "[]\n";
  }

  if (outputFormat === "ndjson" || outputFormat === "dkvp") {
    return "";
  }

  const baseHeaders = getBaseHeaders(input, inputFormat);

  if (baseHeaders.length === 0) {
    return "";
  }

  const transformedHeaders = applyHeaderTransformations(baseHeaders, command);

  if (transformedHeaders.length === 0) {
    return "";
  }

  const delimiter = outputFormat === "tsv" ? "\t" : ",";

  return `${transformedHeaders.join(delimiter)}\n`;
}
