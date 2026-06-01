import type { OutputFormatId } from "@/lib/formats";

export type OutputViewMode = "auto" | "table" | "raw";

export function formatOutputForDisplay(
  output: string,
  outputFormat: OutputFormatId,
): string {
  if (!output.trim()) {
    return output;
  }

  if (outputFormat === "json" || outputFormat === "ndjson") {
    return prettyPrintJsonLines(output, outputFormat);
  }

  return output;
}

function prettyPrintJsonLines(output: string, outputFormat: OutputFormatId) {
  if (outputFormat === "json") {
    try {
      return JSON.stringify(JSON.parse(output), null, 2);
    } catch {
      return output;
    }
  }

  const lines = output.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return output;
  }

  const formattedLines = lines.map((line) => {
    try {
      return JSON.stringify(JSON.parse(line), null, 2);
    } catch {
      return line;
    }
  });

  return formattedLines.join("\n\n");
}

export function canRenderAsTable(
  output: string,
  outputFormat: OutputFormatId,
): boolean {
  if (!output.trim()) {
    return false;
  }

  return outputFormat === "csv" || outputFormat === "tsv";
}
