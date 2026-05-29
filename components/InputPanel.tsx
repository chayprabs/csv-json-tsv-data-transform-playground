import { memo, useRef } from "react";

import { INPUT_EXCEEDS_LIMIT_MESSAGE } from "@/lib/millConstants";
import {
  FORMAT_OPTIONS,
  isDataFormatId,
  type DataFormatId,
} from "@/lib/formats";
import {
  MAX_INPUT_BYTES,
  getInputLargeSlowWarning,
  getInputSizeInBytes,
} from "@/lib/validation";

interface InputPanelProps {
  input: string;
  inputFormat: DataFormatId;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onInputFormatChange: (value: DataFormatId) => void;
  onLoadExample: () => void;
  onClear: () => void;
}

export const InputPanel = memo(function InputPanel({
  input,
  inputFormat,
  disabled,
  onInputChange,
  onInputFormatChange,
  onLoadExample,
  onClear,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputSizeInBytes = getInputSizeInBytes(input);
  const isInputOversize = inputSizeInBytes > MAX_INPUT_BYTES;
  const largeSlowWarning = getInputLargeSlowWarning(input);
  const oversizeId = isInputOversize ? "input-oversize-warning" : undefined;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_INPUT_BYTES) {
      onInputChange("");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    onInputChange(text);
    event.target.value = "";
  };

  return (
    <section className="panel-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Input</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Paste or upload CSV, TSV, JSON, NDJSON, or DKVP.
          </p>
          <p
            className="mt-2 text-sm text-[color:var(--muted)]"
            id="input-stats"
          >
            {input.length.toLocaleString()} characters |{" "}
            {inputSizeInBytes.toLocaleString()} bytes
          </p>
          {largeSlowWarning ? (
            <p
              className="mt-2 text-sm font-medium text-amber-800"
              id="input-slow-warning"
            >
              {largeSlowWarning}
            </p>
          ) : null}
          {isInputOversize ? (
            <p
              className="mt-2 text-sm font-medium text-[color:var(--danger)]"
              id="input-oversize-warning"
              role="alert"
            >
              {INPUT_EXCEEDS_LIMIT_MESSAGE}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label
            className="flex items-center gap-2 text-sm font-medium text-[color:var(--muted)]"
            htmlFor="input-format"
          >
            <span>Format</span>
            <select
              id="input-format"
              className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none"
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
          <input
            ref={fileInputRef}
            accept=".csv,.tsv,.txt,.json,.ndjson,.dkvp,text/*"
            className="sr-only"
            type="file"
            onChange={(event) => void handleFileChange(event)}
            disabled={disabled}
          />
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Upload file
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            type="button"
            onClick={onLoadExample}
            disabled={disabled}
          >
            Load example
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
            type="button"
            onClick={onClear}
            disabled={disabled || input.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <label
        className="mt-4 block text-sm font-medium text-[color:var(--foreground)]"
        htmlFor="input-data"
      >
        Raw data
      </label>
      <textarea
        id="input-data"
        className="mt-2 min-h-[16rem] w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2.5 font-mono text-sm leading-6 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
        spellCheck={false}
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Paste CSV, TSV, JSON, NDJSON, or DKVP data here..."
        disabled={disabled}
        aria-describedby={[
          "input-help",
          "input-stats",
          largeSlowWarning ? "input-slow-warning" : "",
          oversizeId ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <p className="sr-only" id="input-help">
        Supported formats: CSV, TSV, JSON, NDJSON, DKVP. Maximum 10 MB.
      </p>
    </section>
  );
});
