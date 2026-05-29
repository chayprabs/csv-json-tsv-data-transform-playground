import type { OutputFormatId } from "@/lib/formats";

export function formatOutputForDisplay(
  output: string,
  outputFormat: OutputFormatId,
  prettyPrint: boolean,
): string {
  if (!prettyPrint || !output.trim()) {
    return output;
  }

  if (outputFormat === "json") {
    try {
      const parsed = JSON.parse(output) as unknown;
      return `${JSON.stringify(parsed, null, 2)}\n`;
    } catch {
      return output;
    }
  }

  return output;
}

export interface TablePreviewRow {
  cells: string[];
}

const MAX_TABLE_ROWS = 200;
const MAX_TABLE_COLS = 30;

export function parseDelimitedPreview(
  text: string,
  delimiter: "," | "\t",
): { headers: string[]; rows: TablePreviewRow[] } | null {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  const parseLine = (line: string) => {
    if (delimiter === "\t") {
      return line.split("\t");
    }

    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        cells.push(current);
        current = "";
        continue;
      }

      current += ch;
    }

    cells.push(current);
    return cells;
  };

  const headers = parseLine(lines[0] ?? "").slice(0, MAX_TABLE_COLS);
  const rows = lines.slice(1, MAX_TABLE_ROWS + 1).map((line) => ({
    cells: parseLine(line).slice(0, MAX_TABLE_COLS),
  }));

  return { headers, rows };
}
