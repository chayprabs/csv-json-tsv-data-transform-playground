import { memo } from "react";

import { OPERATIONS, type OperationDefinition } from "@/lib/operations";

interface OperationsReferenceProps {
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onInsertOperation: (operation: OperationDefinition) => void;
}

export const OperationsReference = memo(function OperationsReference({
  disabled,
  isOpen,
  onToggle,
  onInsertOperation,
}: OperationsReferenceProps) {
  return (
    <aside className="panel-surface rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Operations reference</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Click any operation to drop its starter syntax into the command bar.
          </p>
        </div>
        <button
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls="operations-reference-list"
          disabled={disabled}
        >
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {isOpen ? (
        <div
          className="mt-4 max-h-[55rem] space-y-3 overflow-y-auto pr-1"
          id="operations-reference-list"
        >
          {OPERATIONS.map((operation) => (
            <button
              key={operation.name}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-left transition hover:border-[color:var(--accent)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => onInsertOperation(operation)}
              disabled={disabled}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-[color:var(--foreground)]">
                    {operation.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {operation.description}
                  </p>
                  <p className="mt-3 font-mono text-xs leading-5 text-[color:var(--accent-strong)]">
                    {operation.example}
                  </p>
                  {operation.supportNote ? (
                    <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
                      Workspace note: {operation.supportNote}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    operation.isSupported
                      ? "bg-[color:var(--background-accent)] text-[color:var(--accent-strong)]"
                      : "border border-amber-300 bg-amber-50 text-amber-700"
                  }`}
                >
                  {operation.isSupported ? "Insert" : "Limited"}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          {OPERATIONS.length} operations available.
        </p>
      )}
    </aside>
  );
});
