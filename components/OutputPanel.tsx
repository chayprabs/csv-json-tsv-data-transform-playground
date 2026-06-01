import { memo } from "react";

import { TablePreview } from "@/components/TablePreview";
import { VirtualizedOutput } from "@/components/VirtualizedOutput";
import { getOutputFormatById, type OutputFormatId } from "@/lib/formats";
import {
  canRenderAsTable,
  formatOutputForDisplay,
  type OutputViewMode,
} from "@/lib/outputDisplay";
import type { CopyStatus, ExecutionStatus, RunSummary } from "@/lib/studioState";

interface OutputPanelProps {
  output: string;
  error: string | null;
  executionStatus: ExecutionStatus;
  outputFormat: OutputFormatId;
  outputViewMode: OutputViewMode;
  runSummary: RunSummary | null;
  copyStatus: CopyStatus;
  statusMessage: string;
  onCopy: () => void;
  onDownload: () => void;
  onRunAgain: () => void;
  onOutputViewModeChange: (mode: OutputViewMode) => void;
}

function getCopyLabel(copyStatus: CopyStatus) {
  if (copyStatus === "copied") {
    return "Copied";
  }

  if (copyStatus === "failed") {
    return "Copy failed";
  }

  return "Copy to clipboard";
}

export const OutputPanel = memo(function OutputPanel({
  output,
  error,
  executionStatus,
  outputFormat,
  outputViewMode,
  runSummary,
  copyStatus,
  statusMessage,
  onCopy,
  onDownload,
  onRunAgain,
  onOutputViewModeChange,
}: OutputPanelProps) {
  const outputFormatLabel = getOutputFormatById(outputFormat).label;
  const hasOutput = output.length > 0;
  const isRunning = executionStatus === "running";
  const isEmptyResult =
    executionStatus === "success" && (runSummary?.outputRows ?? 0) === 0;
  const copyLabel = getCopyLabel(copyStatus);
  const shouldShowRetry = executionStatus === "error";
  const displayOutput = formatOutputForDisplay(output, outputFormat);
  const showTable =
    outputViewMode === "table" ||
    (outputViewMode === "auto" && canRenderAsTable(output, outputFormat));
  const outputText = isRunning
    ? "Running..."
    : hasOutput
      ? displayOutput
      : isEmptyResult
        ? "Transformation returned 0 rows."
        : "Run a transformation to see output here.";

  return (
    <section
      className="panel-surface p-5 sm:p-6"
      aria-busy={isRunning}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Output</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Result rendered as {outputFormatLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <span>View</span>
            <select
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)]"
              value={outputViewMode}
              onChange={(event) =>
                onOutputViewModeChange(event.target.value as OutputViewMode)}
              disabled={isRunning}
            >
              <option value="auto">Auto</option>
              <option value="table">Table</option>
              <option value="raw">Raw</option>
            </select>
          </label>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={onCopy}
            disabled={!hasOutput || isRunning}
          >
            {copyLabel}
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={onDownload}
            disabled={!hasOutput || isRunning}
          >
            Download as file
          </button>
          {shouldShowRetry ? (
            <button
              className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-strong)]"
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
          className="mt-4 rounded-lg border border-[color:var(--danger)]/40 bg-red-50 px-3 py-2.5 font-mono text-sm leading-6 text-[color:var(--danger)]"
          role="alert"
          aria-live="assertive"
        >
          <strong className="font-semibold">Execution error:</strong> {error}
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      <div className="mt-4 space-y-3">
        {isEmptyResult ? (
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--muted)]">
            Transformation returned 0 rows.
          </div>
        ) : null}

        {showTable && hasOutput && !isRunning ? (
          <TablePreview
            text={output}
            delimiter={outputFormat === "tsv" ? "\t" : ","}
          />
        ) : (
          <VirtualizedOutput text={outputText} />
        )}

        {runSummary ? (
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--muted)]">
            <p>
              Input: {runSummary.inputRows} rows -&gt; Output:{" "}
              {runSummary.outputRows} rows
            </p>
            <p className="mt-1">Completed in {runSummary.durationMs}ms</p>
          </div>
        ) : null}
      </div>
    </section>
  );
});
