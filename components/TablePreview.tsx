import { memo } from "react";

import type { TablePreviewRow } from "@/lib/outputDisplay";

interface TablePreviewProps {
  headers: string[];
  rows: TablePreviewRow[];
}

export const TablePreview = memo(function TablePreview({
  headers,
  rows,
}: TablePreviewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--border)]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[color:var(--surface-muted)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[color:var(--border)] px-3 py-2 font-medium text-[color:var(--foreground)]"
              >
                {header || " "}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="odd:bg-white even:bg-[color:var(--surface-strong)]"
            >
              {headers.map((_, colIndex) => (
                <td
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="border-b border-[color:var(--border)] px-3 py-1.5 font-mono text-xs text-[color:var(--foreground)]"
                >
                  {row.cells[colIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
