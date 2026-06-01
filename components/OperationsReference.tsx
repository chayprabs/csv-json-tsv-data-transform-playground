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
    <section className="panel-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Miller commands</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Click an operation to insert it into the command field.
          </p>
        </div>
        <button
          className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium"
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
          className="mt-4 grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2"
          id="operations-reference-list"
        >
          {OPERATIONS.map((operation) => (
            <button
              key={operation.name}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 text-left transition hover:border-[color:var(--accent)] disabled:opacity-50"
              type="button"
              onClick={() => onInsertOperation(operation)}
              disabled={disabled || !operation.isSupported}
              title={operation.supportNote ?? undefined}
            >
              <p className="font-mono text-sm font-semibold">{operation.name}</p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                {operation.description}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          {OPERATIONS.length} curated Miller operations available.
        </p>
      )}
    </section>
  );
});
