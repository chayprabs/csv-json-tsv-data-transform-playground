import { memo } from "react";

interface TablePreviewProps {
  text: string;
  delimiter: "," | "\t";
}

function parseDelimitedRows(text: string, delimiter: "," | "\t"): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

  return lines.map((line) => {
    if (delimiter === "\t") {
      return line.split("\t");
    }

    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        if (inQuotes && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current);
    return cells;
  });
}

export const TablePreview = memo(function TablePreview({
  text,
  delimiter,
}: TablePreviewProps) {
  const rows = parseDelimitedRows(text, delimiter);

  if (rows.length === 0) {
    return null;
  }

  const [headerRow, ...bodyRows] = rows;
  const columnCount = headerRow?.length ?? 0;

  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[color:var(--surface-strong)]">
          <tr>
            {headerRow?.map((cell, columnIndex) => (
              <th
                key={`header-${columnIndex}`}
                className="border-b border-[color:var(--border)] px-3 py-2 font-semibold text-[color:var(--foreground)]"
                scope="col"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="odd:bg-white even:bg-[color:var(--surface-muted)]"
            >
              {Array.from({ length: columnCount }, (_, columnIndex) => (
                <td
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className="border-b border-[color:var(--border)] px-3 py-2 font-mono text-[color:var(--foreground)]"
                >
                  {row[columnIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
