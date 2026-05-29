"use client";

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
import { getOutputFormatById } from "@/lib/formats";
import { getClientSessionId } from "@/lib/clientSession";
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
import {
  MAX_INPUT_BYTES,
  getInputSizeInBytes,
  validateRunRequest,
} from "@/lib/validation";

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
  const commandInputRef = useRef<HTMLInputElement>(null);
  const commandSelectionRef = useRef({ start: 0, end: 0 });

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
  const inputOversize =
    getInputSizeInBytes(state.input) > MAX_INPUT_BYTES;

  const shareableState = useMemo<SharedStudioState>(
    () => ({
      input: state.input,
      command: state.command,
      inputFormat: state.inputFormat,
      outputFormat: state.outputFormat,
    }),
    [state.command, state.input, state.inputFormat, state.outputFormat],
  );

  const shareUrlTooLong = useMemo(
    () => isSharedStateUrlTooLong("/", shareableState),
    [shareableState],
  );

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

    dispatch({
      type: "applyPreset",
      payload: preset,
    });
  }, []);

  const handleLoadExample = useCallback(() => {
    dispatch({ type: "loadExampleDataset" });
  }, []);

  const handleCancel = useCallback(() => {
    activeRequestControllerRef.current?.abort();
    activeRequestControllerRef.current = null;
    dispatch({ type: "cancelRun" });
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
      className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
      id="main-content"
    >
      {shareUrlTooLong ? (
        <p
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="status"
        >
          This workspace is too large to save in the URL. Copy your data locally
          before leaving the page.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <label
          className="sr-only"
          htmlFor="preset-select"
        >
          Example preset
        </label>
        <select
          id="preset-select"
          className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-[color:var(--foreground)] outline-none"
          value={state.selectedPresetId}
          onChange={(event) => handlePresetChange(event.target.value)}
          disabled={isRunning || inputOversize}
          aria-label="Load an example preset"
        >
          <option value={CUSTOM_PRESET_ID}>Custom workspace</option>
          {EXAMPLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-5">
        <InputPanel
          input={state.input}
          inputFormat={state.inputFormat}
          disabled={isRunning || inputOversize}
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
          onCaptureCommandSelection={() => {
            const el = commandInputRef.current;
            if (el && typeof el.selectionStart === "number") {
              commandSelectionRef.current = {
                start: el.selectionStart,
                end: el.selectionEnd ?? el.selectionStart,
              };
            }
          }}
          onOutputFormatChange={handleOutputFormatChange}
          onRun={() => void handleRun()}
          onCancel={handleCancel}
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
      </div>
    </main>
  );
}
