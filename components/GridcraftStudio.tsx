"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

import { CommandBar } from "@/components/CommandBar";
import { InputPanel } from "@/components/InputPanel";
import { OutputPanel } from "@/components/OutputPanel";
import { deriveEmptyOutputFallback } from "@/lib/emptyOutput";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getFormatById } from "@/lib/formats";
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
      <aside className="panel-surface rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Operations reference</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Loading the operation catalog...
        </p>
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
    <aside className="panel-surface rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Operations reference</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Open the full operation catalog when you need starter syntax or a
            quick reminder.
          </p>
        </div>
        <button
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
          type="button"
          onClick={onOpen}
          disabled={disabled}
        >
          Open
        </button>
      </div>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Browse the full operations catalog on demand.
      </p>
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

  const handleOperationInsert = useCallback((insertText: string) => {
    dispatch({
      type: "insertOperation",
      payload: insertText,
    });
  }, []);

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

      const outputRows = countRowsForFormat(
        result.output,
        shareableState.outputFormat,
      );
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
            inputRows: countRowsForFormat(
              shareableState.input,
              shareableState.inputFormat,
            ),
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

    const format = getFormatById(state.outputFormat);
    const blob = new Blob([state.execution.output], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    anchor.href = url;
    anchor.download = `output_${timestamp}.${format.extension}`;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }, [state.execution.output, state.outputFormat]);

  return (
    <main
      className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
      id="main-content"
    >
      <div className="rounded-[2rem] border border-white/60 bg-white/40 p-4 backdrop-blur sm:p-6 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-6">
            <header className="panel-surface rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                    Gridcraft Studio
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Transform structured data with reusable command chains
                  </h1>
                  <p className="mt-3 text-balance text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                    Build data transformations across CSV, TSV, JSON, NDJSON,
                    and DKVP in one workspace. Load examples, run command chains,
                    and share exact workspace state through the URL.
                  </p>
                </div>

                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                  <label
                    className="block text-sm font-semibold text-[color:var(--foreground)]"
                    htmlFor="preset-select"
                  >
                    Example presets
                  </label>
                  <select
                    id="preset-select"
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none"
                    value={state.selectedPresetId}
                    onChange={(event) => handlePresetChange(event.target.value)}
                    disabled={isRunning}
                  >
                    <option value={CUSTOM_PRESET_ID}>Custom workspace</option>
                    {EXAMPLE_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[color:var(--muted)]">
                    {selectedPreset?.description ??
                      "Editing a custom input and command combination."}
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
              disabled={isRunning}
              isRunning={isRunning}
              onCommandChange={handleCommandChange}
              onCommandKeyDown={handleCommandKeyDown}
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
      </div>
    </main>
  );
}
