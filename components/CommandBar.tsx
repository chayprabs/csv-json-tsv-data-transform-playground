import { memo, type Ref, type KeyboardEvent, type LegacyRef } from "react";

import {
  OUTPUT_FORMAT_OPTIONS,
  isOutputFormatId,
  type OutputFormatId,
} from "@/lib/formats";

import { MAX_COMMAND_LENGTH } from "@/lib/validation";

interface CommandBarProps {
  command: string;
  outputFormat: OutputFormatId;
  commandInputRef: Ref<HTMLInputElement | null>;
  disabled: boolean;
  isRunning: boolean;
  onCommandChange: (value: string) => void;
  onCommandKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCaptureCommandSelection: () => void;
  onOutputFormatChange: (value: OutputFormatId) => void;
  onRun: () => void;
  onCancel?: () => void;
}

export const CommandBar = memo(function CommandBar({
  command,
  outputFormat,
  commandInputRef,
  disabled,
  isRunning,
  onCommandChange,
  onCommandKeyDown,
  onCaptureCommandSelection,
  onOutputFormatChange,
  onRun,
  onCancel,
}: CommandBarProps) {
  return (
    <section className="panel-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label
            className="block text-sm font-medium text-[color:var(--foreground)]"
            htmlFor="transform-command"
          >
            Command
          </label>
          <input
            ref={commandInputRef as LegacyRef<HTMLInputElement>}
            id="transform-command"
            className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2.5 font-mono text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
            type="text"
            spellCheck={false}
            maxLength={MAX_COMMAND_LENGTH}
            value={command}
            onChange={(event) => onCommandChange(event.target.value)}
            onKeyDown={onCommandKeyDown}
            onSelect={onCaptureCommandSelection}
            onBlur={onCaptureCommandSelection}
            onKeyUp={onCaptureCommandSelection}
            onClick={onCaptureCommandSelection}
            placeholder="filter '$age > 30' then cut -f name,age"
            disabled={disabled}
            aria-describedby="command-help"
          />
          <p
            className="mt-2 text-xs text-[color:var(--muted)]"
            id="command-help"
          >
            <code>Cmd/Ctrl+Enter</code> runs. Arrow keys browse command history.
            Max {MAX_COMMAND_LENGTH} characters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className="flex items-center gap-2 text-sm font-medium text-[color:var(--muted)]"
            htmlFor="output-format"
          >
            <span>Output</span>
            <select
              id="output-format"
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
              value={outputFormat}
              onChange={(event) => {
                if (isOutputFormatId(event.target.value)) {
                  onOutputFormatChange(event.target.value);
                }
              }}
              disabled={disabled}
            >
              {OUTPUT_FORMAT_OPTIONS.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>
          {isRunning && onCancel ? (
            <button
              className="rounded-lg border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--danger)] hover:text-[color:var(--danger)]"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
          <button
            className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onRun}
            disabled={disabled}
          >
            {isRunning ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Running...
              </span>
            ) : (
              "Run"
            )}
          </button>
        </div>
      </div>
    </section>
  );
});
