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
import {
  readAutoRunPreference,
  writeAutoRunPreference,
} from "@/lib/autoRunPreference";
import { deriveEmptyOutputFallback } from "@/lib/emptyOutput";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getOutputFormatById } from "@/lib/formats";
import { getClientSessionId } from "@/lib/clientSession";
import type { OutputViewMode } from "@/lib/outputDisplay";
import { EXAMPLE_PRESETS } from "@/lib/presets";
import { countRowsForFormat } from "@/lib/runMetrics";
import { runTransform } from "@/lib/runTransform";
import {
  buildSharedStateUrl,
  isSharedStateUrlTooLong,
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

interface MillWorkspaceProps {
  initialSharedState: SharedStudioState | null;
}

export function MillWorkspace({ initialSharedState }: MillWorkspaceProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    studioReducer,
    initialSharedState,
    createInitialStudioState,
  );
  const activeRequestControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const commandInputRef = useRef<HTMLTextAreaElement>(null);
  const commandSelectionRef = useRef({ start: 0, end: 0 });
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkTooLong, setLinkTooLong] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [outputViewMode, setOutputViewMode] = useState<OutputViewMode>("auto");

  useEffect(() => {
    setAutoRunEnabled(readAutoRunPreference());
  }, []);

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
    setLinkTooLong(isSharedStateUrlTooLong(shareableState));
  }, [shareableState]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrl = buildSharedStateUrl("/", shareableState);
      if (!nextUrl) {
        return;
      }

      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl !== nextUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, 400);

    return () => window.clearTimeout(timer);
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

    setUploadedFileName(null);
    dispatch({
      type: "applyPreset",
      payload: preset,
    });
  }, []);

  const handleLoadExample = useCallback(() => {
    setUploadedFileName(null);
    dispatch({ type: "loadExampleDataset" });
  }, []);

  const handleFileUpload = useCallback(
    ({ text, fileName }: { text: string; fileName: string }) => {
      setUploadedFileName(fileName);
      dispatch({
        type: "updateInput",
        payload: text,
      });
    },
    [],
  );

  const captureCommandSelection = useCallback(() => {
    const el = commandInputRef.current;
    if (el && typeof el.selectionStart === "number") {
      commandSelectionRef.current = {
        start: el.selectionStart,
        end: el.selectionEnd ?? el.selectionStart,
      };
    }
  }, []);

  const handleOperationInsert = useCallback((insertText: string) => {
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
  }, []);

  const handleInputChange = useCallback((nextInput: string) => {
    setUploadedFileName(null);
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

      const nextUrl = buildSharedStateUrl("/", shareableState);
      if (nextUrl) {
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (currentUrl !== nextUrl) {
          router.replace(nextUrl, { scroll: false });
        }
      }
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
  }, [getSessionId, router, shareableState]);

  const handleCancel = useCallback(() => {
    activeRequestControllerRef.current?.abort();
    activeRequestControllerRef.current = null;
    latestRequestIdRef.current += 1;
    dispatch({ type: "cancelRun" });
  }, []);

  const handleClearOutput = useCallback(() => {
    dispatch({ type: "clearOutput" });
  }, []);

  useEffect(() => {
    if (!autoRunEnabled || isRunning) {
      return undefined;
    }

    const validationError = validateRunRequest({
      input: shareableState.input,
      command: shareableState.command,
    });

    if (validationError) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void handleRun();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [autoRunEnabled, handleRun, isRunning, shareableState]);

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
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "ArrowUp" && !event.shiftKey && !event.metaKey) {
        event.preventDefault();
        dispatch({ type: "historyUp" });
        return;
      }

      if (event.key === "ArrowDown" && !event.shiftKey && !event.metaKey) {
        event.preventDefault();
        dispatch({ type: "historyDown" });
      }
    },
    [],
  );

  const handleCopyWorkspaceLink = useCallback(async () => {
    if (linkTooLong) {
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is not available in this browser.");
      }

      const path = buildSharedStateUrl("/", shareableState);
      if (!path) {
        return;
      }

      const fullUrl =
        path === "/"
          ? `${window.location.origin}/`
          : `${window.location.origin}${path}`;

      await navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      window.setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch {
      setLinkCopied(false);
    }
  }, [linkTooLong, shareableState]);

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

  const handleAutoRunChange = useCallback((enabled: boolean) => {
    setAutoRunEnabled(enabled);
    writeAutoRunPreference(enabled);
  }, []);

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6"
      id="main-content"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-50"
            type="button"
            onClick={() => void handleCopyWorkspaceLink()}
            disabled={isRunning || linkTooLong}
          >
            {linkCopied ? "Copied link" : "Copy link"}
          </button>
          {linkTooLong ? (
            <p className="text-xs text-amber-800">
              Workspace is too large to share in the URL. Copy input and command
              manually.
            </p>
          ) : null}
        </div>

        <div className="w-full sm:max-w-[16rem]">
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
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {selectedPreset?.description ?? "Your own input and command."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-5">
          <InputPanel
            input={state.input}
            inputFormat={state.inputFormat}
            uploadedFileName={uploadedFileName}
            disabled={isRunning}
            onInputChange={handleInputChange}
            onInputFormatChange={handleInputFormatChange}
            onLoadExample={handleLoadExample}
            onFileUpload={handleFileUpload}
          />

          <CommandBar
            command={state.command}
            outputFormat={state.outputFormat}
            commandInputRef={commandInputRef}
            disabled={isRunning}
            isRunning={isRunning}
            autoRunEnabled={autoRunEnabled}
            onAutoRunChange={handleAutoRunChange}
            onCommandChange={handleCommandChange}
            onCommandKeyDown={handleCommandKeyDown}
            onCaptureCommandSelection={captureCommandSelection}
            onOutputFormatChange={handleOutputFormatChange}
            onRun={() => void handleRun()}
            onCancel={handleCancel}
            onClear={handleClearOutput}
          />

          <OutputPanel
            output={state.execution.output}
            error={state.execution.errorMessage}
            executionStatus={state.execution.status}
            outputFormat={state.outputFormat}
            outputViewMode={outputViewMode}
            runSummary={state.execution.runSummary}
            copyStatus={state.copyStatus}
            statusMessage={state.statusMessage}
            onCopy={() => void handleCopy()}
            onDownload={handleDownload}
            onRunAgain={() => void handleRun()}
            onOutputViewModeChange={setOutputViewMode}
          />
        </section>

        <OperationsReference
          disabled={isRunning}
          isOpen={state.isReferenceOpen}
          onToggle={() => dispatch({ type: "toggleReference" })}
          onInsertOperation={(operation) =>
            handleOperationInsert(operation.insertText)}
        />
      </div>
    </main>
  );
}
