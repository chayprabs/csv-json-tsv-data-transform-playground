import { memo } from "react";

import {
  FORMAT_OPTIONS,
  isDataFormatId,
  type DataFormatId,
} from "@/lib/formats";
import { getInputSizeInBytes } from "@/lib/validation";

interface InputPanelProps {
  input: string;
  inputFormat: DataFormatId;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onInputFormatChange: (value: DataFormatId) => void;
  onLoadExample: () => void;
}

export const InputPanel = memo(function InputPanel({
  input,
  inputFormat,
  disabled,
  onInputChange,
  onInputFormatChange,
  onLoadExample,
}: InputPanelProps) {
  const inputSizeInBytes = getInputSizeInBytes(input);

  return (
    <section className="panel-surface rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Input</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Paste raw data in one of the supported text formats.
          </p>
          <p
            className="mt-2 text-sm text-[color:var(--muted)]"
            id="input-stats"
          >
            {input.length.toLocaleString()} characters ·{" "}
            {inputSizeInBytes.toLocaleString()} bytes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label
            className="flex items-center gap-2 text-sm font-medium text-[color:var(--muted)]"
            htmlFor="input-format"
          >
            <span>Format</span>
            <select
              id="input-format"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
              value={inputFormat}
              onChange={(event) => {
                if (isDataFormatId(event.target.value)) {
                  onInputFormatChange(event.target.value);
                }
              }}
              disabled={disabled}
            >
              {FORMAT_OPTIONS.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            type="button"
            onClick={onLoadExample}
            disabled={disabled}
          >
            Load example
          </button>
        </div>
      </div>

      <label
        className="mt-4 block text-sm font-semibold text-[color:var(--foreground)]"
        htmlFor="input-data"
      >
        Raw data
      </label>
      <textarea
        id="input-data"
        className="mt-4 min-h-[21rem] w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 font-mono text-sm leading-6 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
        spellCheck={false}
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Paste CSV, TSV, JSON, NDJSON, or DKVP data here..."
        disabled={disabled}
        aria-describedby="input-help input-stats"
      />
      <p className="mt-2 text-sm text-[color:var(--muted)]" id="input-help">
        Paste CSV, TSV, JSON, NDJSON, or DKVP data here.
      </p>
    </section>
  );
});
