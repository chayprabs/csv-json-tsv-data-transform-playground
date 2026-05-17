"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

import { CommandBar } from "@/components/CommandBar";
import { InputPanel } from "@/components/InputPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { deriveEmptyOutputFallback } from "@/lib/emptyOutput";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getOutputFormatById } from "@/lib/formats";
import { getClientSessionId } from "@/lib/clientSession";
import { EXAMPLE_PRESETS } from "@/lib/presets";
import { countRowsForFormat } from "@/lib/runMetrics";
import { runTransform } from "@/lib/runTransform";
import {
  buildSharedStateUrl,
  type SharedStudioState,
} from "@/lib/shareState";
import {
  CUSTOM_PRESET_ID,
  createInitialStudioState,
  studioReducer,
} from "@/lib/studioState";
import { validateRunRequest } from "@/lib/validation";

const OperationsReference = dynamic(
  () =>
    import("@/components/OperationsReference").then(
      (module) => module.OperationsReference,
    ),
  {
    loading: () => (
      <aside className="panel-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Operations</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">Loading…</p>
      </aside>
    ),
  },
);

function CollapsedOperationsReference({
  disabled,
  onOpen,
}: {
  disabled: boolean;
  onOpen: () => void;
}) {
  return (
    <aside className="panel-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Operations</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Open the list to insert example commands.
          </p>
        </div>
        <button
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          type="button"
          onClick={onOpen}
          disabled={disabled}
        >
          Open
        </button>
      </div>
    </aside>
  );
}

interface GridcraftStudioProps {
  initialSharedState: SharedStudioState | null;
}

export function GridcraftStudio({
  initialSharedState,
}: GridcraftStudioProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    studioReducer,
    initialSharedState,
    createInitialStudioState,
  );
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const commandSelectionRef = useRef({ start: 0, end: 0 });
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (state.copyStatus === "idle") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "resetCopyStatus" });
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [state.copyStatus]);

  useEffect(() => {
    return () => {
      activeRequestControllerRef.current?.abort();
    };
  }, []);

  const isRunning = state.execution.status === "running";

  const selectedPreset = useMemo(
    () =>
      EXAMPLE_PRESETS.find((preset) => preset.id === state.selectedPresetId) ??
      null,
    [state.selectedPresetId],
  );

  const shareableState = useMemo<SharedStudioState>(
    () => ({
      input: state.input,
      command: state.command,
      inputFormat: state.inputFormat,
      outputFormat: state.outputFormat,
    }),
    [state.command, state.input, state.inputFormat, state.outputFormat],
  );

  useEffect(() => {
    const nextUrl = buildSharedStateUrl("/", shareableState);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl === nextUrl) {
      return;
    }

    router.replace(nextUrl, {
      scroll: false,
    });
  }, [router, shareableState]);

  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = getClientSessionId();
    }

    return sessionIdRef.current;
  }, []);

  const handlePresetChange = useCallback((presetId: string) => {
    if (presetId === CUSTOM_PRESET_ID) {
      dispatch({ type: "selectCustomWorkspace" });
      return;
    }

    const preset = EXAMPLE_PRESETS.find((candidate) => candidate.id === presetId);

    if (!preset) {
      return;
    }

    dispatch({
      type: "applyPreset",
      payload: preset,
    });
  }, []);

  const handleLoadExample = useCallback(() => {
    dispatch({ type: "loadExampleDataset" });
  }, []);

  const captureCommandSelection = useCallback(() => {
    const el = commandInputRef.current;
    if (el && typeof el.selectionStart === "number") {
      commandSelectionRef.current = {
        start: el.selectionStart,
        end: el.selectionEnd ?? el.selectionStart,
      };
    }
  }, []);

  const handleOperationInsert = useCallback(
    (insertText: string) => {
      const el = commandInputRef.current;
      let start = commandSelectionRef.current.start;
      let end = commandSelectionRef.current.end;
      if (
        document.activeElement === el &&
        el &&
        typeof el.selectionStart === "number"
      ) {
        start = el.selectionStart;
        end = el.selectionEnd ?? el.selectionStart;
      }

      dispatch({
        type: "insertOperation",
        payload: { text: insertText, start, end },
      });

      queueMicrotask(() => {
        el?.focus();
        const pos = start + insertText.length;
        el?.setSelectionRange(pos, pos);
        commandSelectionRef.current = { start: pos, end: pos };
      });
    },
    [],
  );

  const handleInputChange = useCallback((nextInput: string) => {
    dispatch({
      type: "updateInput",
      payload: nextInput,
    });
  }, []);

  const handleCommandChange = useCallback((nextCommand: string) => {
    dispatch({
      type: "updateCommand",
      payload: nextCommand,
    });
  }, []);

  const handleInputFormatChange = useCallback(
    (nextFormat: SharedStudioState["inputFormat"]) => {
      dispatch({
        type: "updateInputFormat",
        payload: nextFormat,
      });
    },
    [],
  );

  const handleOutputFormatChange = useCallback(
    (nextFormat: SharedStudioState["outputFormat"]) => {
      dispatch({
        type: "updateOutputFormat",
        payload: nextFormat,
      });
    },
    [],
  );

  const handleRun = useCallback(async () => {
    const validationError = validateRunRequest({
      input: shareableState.input,
      command: shareableState.command,
    });

    if (validationError) {
      dispatch({
        type: "runFailure",
        payload: {
          errorMessage: validationError.message,
        },
      });
      return;
    }

    dispatch({
      type: "recordCommandHistory",
      payload: shareableState.command,
    });

    activeRequestControllerRef.current?.abort();
    const requestController = new AbortController();
    activeRequestControllerRef.current = requestController;
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;
    const startedAt = performance.now();

    dispatch({ type: "startRun" });

    try {
      const result = await runTransform(shareableState, {
        signal: requestController.signal,
        sessionId: getSessionId(),
      });

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      if (result.error) {
        dispatch({
          type: "runFailure",
          payload: {
            errorMessage: result.error,
          },
        });
        return;
      }

      const durationMs = Math.round(performance.now() - startedAt);

      const inputRows =
        result.inputRowCount ??
        countRowsForFormat(shareableState.input, shareableState.inputFormat);
      const outputRows =
        result.outputRowCount ??
        countRowsForFormat(result.output, shareableState.outputFormat);
      const displayOutput =
        outputRows === 0 && !result.output
          ? deriveEmptyOutputFallback({
              input: shareableState.input,
              command: shareableState.command,
              inputFormat: shareableState.inputFormat,
              outputFormat: shareableState.outputFormat,
            })
          : result.output;

      dispatch({
        type: "runSuccess",
        payload: {
          output: displayOutput,
          runSummary: {
            inputRows,
            outputRows,
            durationMs,
          },
        },
      });
    } catch (error) {
      if (requestController.signal.aborted || requestId !== latestRequestIdRef.current) {
        return;
      }

      dispatch({
        type: "runFailure",
        payload: {
          errorMessage: sanitizeErrorMessage(
            error,
            "Unexpected error while running the transformation.",
          ),
        },
      });
    } finally {
      if (activeRequestControllerRef.current === requestController) {
        activeRequestControllerRef.current = null;
      }
    }
  }, [
    getSessionId,
    shareableState,
  ]);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") {
        return;
      }

      if (isRunning) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      void handleRun();
    };

    window.addEventListener("keydown", handleGlobalShortcut);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, [handleRun, isRunning]);

  const handleCommandKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        dispatch({ type: "historyUp" });
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        dispatch({ type: "historyDown" });
      }
    },
    [],
  );

  const handleCopyWorkspaceLink = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is not available in this browser.");
      }

      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch {
      setLinkCopied(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!state.execution.output) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is not available in this browser.");
      }

      await navigator.clipboard.writeText(state.execution.output);
      dispatch({
        type: "setCopyStatus",
        payload: "copied",
      });
    } catch {
      dispatch({
        type: "setCopyStatus",
        payload: "failed",
      });
    }
  }, [state.execution.output]);

  const handleDownload = useCallback(() => {
    if (!state.execution.output) {
      return;
    }

    const format = getOutputFormatById(state.outputFormat);
    const blob = new Blob([state.execution.output], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `output.${format.extension}`;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }, [state.execution.output, state.outputFormat]);

  return (
    <main
      className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6"
      id="main-content"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-5">
          <header className="panel-surface p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
                  Mill
                </h1>
                <p className="max-w-xl text-sm leading-6 text-[color:var(--muted)]">
                  Paste data, run Miller-style command chains, copy or download
                  results. The URL saves your workspace. Data is processed on this
                  server.
                </p>
                <button
                  className="self-start rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-50"
                  type="button"
                  onClick={() => void handleCopyWorkspaceLink()}
                  disabled={isRunning}
                >
                  {linkCopied ? "Copied link" : "Copy link"}
                </button>
              </div>

              <div className="w-full shrink-0 sm:max-w-[14rem]">
                <label
                  className="block text-sm font-medium text-[color:var(--foreground)]"
                  htmlFor="preset-select"
                >
                  Preset
                </label>
                <select
                  id="preset-select"
                  className="mt-1.5 w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none"
                  value={state.selectedPresetId}
                  onChange={(event) => handlePresetChange(event.target.value)}
                  disabled={isRunning}
                >
                  <option value={CUSTOM_PRESET_ID}>Custom</option>
                  {EXAMPLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                  {selectedPreset?.description ??
                    "Your own input and command."}
                </p>
              </div>
            </div>
          </header>

          <InputPanel
            input={state.input}
            inputFormat={state.inputFormat}
            disabled={isRunning}
            onInputChange={handleInputChange}
            onInputFormatChange={handleInputFormatChange}
            onLoadExample={handleLoadExample}
          />

          <CommandBar
            command={state.command}
            outputFormat={state.outputFormat}
            commandInputRef={commandInputRef}
            disabled={isRunning}
            isRunning={isRunning}
            onCommandChange={handleCommandChange}
            onCommandKeyDown={handleCommandKeyDown}
            onCaptureCommandSelection={captureCommandSelection}
            onOutputFormatChange={handleOutputFormatChange}
            onRun={() => void handleRun()}
          />

          <OutputPanel
            output={state.execution.output}
            error={state.execution.errorMessage}
            executionStatus={state.execution.status}
            outputFormat={state.outputFormat}
            runSummary={state.execution.runSummary}
            copyStatus={state.copyStatus}
            statusMessage={state.statusMessage}
            onCopy={() => void handleCopy()}
            onDownload={handleDownload}
            onRunAgain={() => void handleRun()}
          />
        </section>

        {state.isReferenceOpen ? (
          <OperationsReference
            disabled={isRunning}
            isOpen={state.isReferenceOpen}
            onToggle={() => dispatch({ type: "toggleReference" })}
            onInsertOperation={(operation) =>
              handleOperationInsert(operation.insertText)}
          />
        ) : (
          <CollapsedOperationsReference
            disabled={isRunning}
            onOpen={() => dispatch({ type: "toggleReference" })}
          />
        )}
      </div>
    </main>
  );
}
