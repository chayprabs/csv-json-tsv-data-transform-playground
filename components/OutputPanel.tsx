import { memo, useMemo } from "react";

import { TablePreview } from "@/components/TablePreview";
import { VirtualizedOutput } from "@/components/VirtualizedOutput";
import { getOutputFormatById, type OutputFormatId } from "@/lib/formats";
import {
  formatOutputForDisplay,
  parseDelimitedPreview,
} from "@/lib/outputDisplay";
import type { CopyStatus, ExecutionStatus, RunSummary } from "@/lib/studioState";

interface OutputPanelProps {
  output: string;
  error: string | null;
  executionStatus: ExecutionStatus;
  outputFormat: OutputFormatId;
  runSummary: RunSummary | null;
  copyStatus: CopyStatus;
  statusMessage: string;
  prettyPrint: boolean;
  tableView: boolean;
  onPrettyPrintChange: (value: boolean) => void;
  onTableViewChange: (value: boolean) => void;
  onCopy: () => void;
  onDownload: () => void;
  onClear: () => void;
  onRunAgain: () => void;
}

function getCopyLabel(copyStatus: CopyStatus) {
  if (copyStatus === "copied") {
    return "Copied";
  }

  if (copyStatus === "failed") {
    return "Copy failed";
  }

  return "Copy";
}

export const OutputPanel = memo(function OutputPanel({
  output,
  error,
  executionStatus,
  outputFormat,
  runSummary,
  copyStatus,
  statusMessage,
  prettyPrint,
  tableView,
  onPrettyPrintChange,
  onTableViewChange,
  onCopy,
  onDownload,
  onClear,
  onRunAgain,
}: OutputPanelProps) {
  const outputFormatLabel = getOutputFormatById(outputFormat).label;
  const hasOutput = output.length > 0;
  const isRunning = executionStatus === "running";
  const isEmptyResult =
    executionStatus === "success" && (runSummary?.outputRows ?? 0) === 0;
  const copyLabel = getCopyLabel(copyStatus);
  const shouldShowRetry = executionStatus === "error";

  const displayOutput = useMemo(
    () => formatOutputForDisplay(output, outputFormat, prettyPrint),
    [output, outputFormat, prettyPrint],
  );

  const tablePreview = useMemo(() => {
    if (!tableView || !hasOutput) {
      return null;
    }

    if (outputFormat === "csv") {
      return parseDelimitedPreview(displayOutput, ",");
    }

    if (outputFormat === "tsv") {
      return parseDelimitedPreview(displayOutput, "\t");
    }

    return null;
  }, [displayOutput, hasOutput, outputFormat, tableView]);

  const outputText = isRunning
    ? "Running..."
    : hasOutput
      ? displayOutput
      : isEmptyResult
        ? "Transformation returned 0 rows."
        : "Run a transformation to see output here.";

  const canPrettyPrint = outputFormat === "json" && hasOutput;
  const canTableView =
    (outputFormat === "csv" || outputFormat === "tsv") && hasOutput;

  return (
    <section className="panel-surface p-5 sm:p-6" aria-busy={isRunning}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Output</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Result as {outputFormatLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPrettyPrint ? (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-medium text-[color:var(--muted)]">
              <input
                checked={prettyPrint}
                className="h-3.5 w-3.5"
                type="checkbox"
                onChange={(event) => onPrettyPrintChange(event.target.checked)}
                disabled={isRunning}
              />
              Pretty JSON
            </label>
          ) : null}
          {canTableView ? (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-medium text-[color:var(--muted)]">
              <input
                checked={tableView}
                className="h-3.5 w-3.5"
                type="checkbox"
                onChange={(event) => onTableViewChange(event.target.checked)}
                disabled={isRunning}
              />
              Table view
            </label>
          ) : null}
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] disabled:opacity-50"
            type="button"
            onClick={onCopy}
            disabled={!hasOutput || isRunning}
          >
            {copyLabel}
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] disabled:opacity-50"
            type="button"
            onClick={onDownload}
            disabled={!hasOutput || isRunning}
          >
            Download
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)] disabled:opacity-50"
            type="button"
            onClick={onClear}
            disabled={!hasOutput || isRunning}
          >
            Clear
          </button>
          {shouldShowRetry ? (
            <button
              className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-white"
              type="button"
              onClick={onRunAgain}
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-lg border border-[color:var(--danger)]/40 bg-red-50 px-3 py-2.5 font-mono text-sm text-[color:var(--danger)]"
          role="alert"
          aria-live="assertive"
        >
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      <div className="mt-4">
        {tablePreview ? (
          <TablePreview
            headers={tablePreview.headers}
            rows={tablePreview.rows}
          />
        ) : (
          <VirtualizedOutput text={outputText} />
        )}

        {runSummary ? (
          <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--muted)]">
            <p>
              {runSummary.inputRows} rows in → {runSummary.outputRows} rows out
              · {runSummary.durationMs}ms
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
});
