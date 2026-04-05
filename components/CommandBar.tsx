import { memo, type KeyboardEvent } from "react";

import {
  FORMAT_OPTIONS,
  isDataFormatId,
  type DataFormatId,
} from "@/lib/formats";

interface CommandBarProps {
  command: string;
  outputFormat: DataFormatId;
  disabled: boolean;
  isRunning: boolean;
  onCommandChange: (value: string) => void;
  onCommandKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onOutputFormatChange: (value: DataFormatId) => void;
  onRun: () => void;
}

export const CommandBar = memo(function CommandBar({
  command,
  outputFormat,
  disabled,
  isRunning,
  onCommandChange,
  onCommandKeyDown,
  onOutputFormatChange,
  onRun,
}: CommandBarProps) {
  return (
    <section className="panel-surface rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label
            className="block text-sm font-semibold text-[color:var(--foreground)]"
            htmlFor="transform-command"
          >
            Transformation command
          </label>
          <input
            id="transform-command"
            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 font-mono text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)]"
            type="text"
            spellCheck={false}
            value={command}
            onChange={(event) => onCommandChange(event.target.value)}
            onKeyDown={onCommandKeyDown}
            placeholder="filter '$age > 30' then cut -f name,age"
            disabled={disabled}
            aria-describedby="command-help"
          />
          <p
            className="mt-2 text-sm text-[color:var(--muted)]"
            id="command-help"
          >
            Full operation chain only. Example:{" "}
            <code>filter &apos;$age &gt; 30&apos; then cut -f name,age</code>.
            Run with <code>Cmd/Ctrl + Enter</code>. Arrow Up and Arrow Down step
            through the last 20 commands.
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
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none ring-0"
              value={outputFormat}
              onChange={(event) => {
                if (isDataFormatId(event.target.value)) {
                  onOutputFormatChange(event.target.value);
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
            className="rounded-xl bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={onRun}
            disabled={isRunning}
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
