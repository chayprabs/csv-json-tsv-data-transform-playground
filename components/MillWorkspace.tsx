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
import { readAutoRunPreference, writeAutoRunPreference } from "@/lib/autoRunPreference";
import { deriveEmptyOutputFallback } from "@/lib/emptyOutput";
import { sanitizeErrorMessage } from "@/lib/errorSanitization";
import { getOutputFormatById } from "@/lib/formats";
import { getClientSessionId } from "@/lib/clientSession";
import type { OperationDefinition } from "@/lib/operations";
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

const OperationsReference = dynamic(
  () =>
    import("@/components/OperationsReference").then(
      (module) => module.OperationsReference,
    ),
  {
    loading: () => (
      <section className="panel-surface p-5">
        <p className="text-sm text-[color:var(--muted)]">Loading operations…</p>
      </section>
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
  const [autoRun, setAutoRun] = useState(false);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [tableView, setTableView] = useState(false);

  useEffect(() => {
    setAutoRun(readAutoRunPreference());
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
  const inputOversize = getInputSizeInBytes(state.input) > MAX_INPUT_BYTES;
  const runDisabled = isRunning || inputOversize;

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

  const handleRun = useCallback(async () => {
    const validationError = validateRunRequest({
      input: shareableState.input,
      command: shareableState.command,
    });

    if (validationError) {
      dispatch({
        type: "runFailure",
        payload: { errorMessage: validationError.message },
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
          payload: { errorMessage: result.error },
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
          runSummary: { inputRows, outputRows, durationMs },
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
      if (
        requestController.signal.aborted ||
        requestId !== latestRequestIdRef.current
      ) {
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
    if (!autoRun || runDisabled) {
      return undefined;
    }

    if (!shareableState.input.trim() || !shareableState.command.trim()) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void handleRun();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [autoRun, handleRun, runDisabled, shareableState]);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") {
        return;
      }

      if (event.shiftKey) {
        return;
      }

      if (runDisabled) {
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
  }, [handleRun, runDisabled]);

  const handlePresetChange = useCallback((presetId: string) => {
    if (presetId === CUSTOM_PRESET_ID) {
      dispatch({ type: "selectCustomWorkspace" });
      return;
    }

    const preset = EXAMPLE_PRESETS.find((candidate) => candidate.id === presetId);

    if (preset) {
      dispatch({ type: "applyPreset", payload: preset });
    }
  }, []);

  const handleCopyWorkspaceLink = useCallback(async () => {
    if (shareUrlTooLong) {
      dispatch({
        type: "runFailure",
        payload: {
          errorMessage:
            "Workspace is too large to share in the URL. Save your data locally.",
        },
      });
      return;
    }

    try {
      const path = buildSharedStateUrl("/", shareableState);

      if (!path) {
        throw new Error("Unable to build a shareable link.");
      }

      const fullUrl =
        path === "/"
          ? `${window.location.origin}/`
          : `${window.location.origin}${path}`;

      await navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      dispatch({
        type: "setCopyStatus",
        payload: "copied",
      });
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
      dispatch({
        type: "runFailure",
        payload: { errorMessage: "Could not copy link to the clipboard." },
      });
    }
  }, [shareUrlTooLong, shareableState]);

  const handleOperationInsert = useCallback((operation: OperationDefinition) => {
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
      payload: { text: operation.insertText, start, end },
    });

    queueMicrotask(() => {
      el?.focus();
      const pos = start + operation.insertText.length;
      el?.setSelectionRange(pos, pos);
      commandSelectionRef.current = { start: pos, end: pos };
    });
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

  const handleCommandKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "ArrowUp" && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "historyUp" });
        return;
      }

      if (event.key === "ArrowDown" && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "historyDown" });
      }
    },
    [],
  );

  const handleAutoRunChange = useCallback((enabled: boolean) => {
    setAutoRun(enabled);
    writeAutoRunPreference(enabled);
  }, []);

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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-50"
            type="button"
            onClick={() => void handleCopyWorkspaceLink()}
            disabled={runDisabled || shareUrlTooLong}
          >
            {linkCopied ? "Link copied" : "Copy link"}
          </button>
          <button
            className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]"
            type="button"
            onClick={() => dispatch({ type: "toggleReference" })}
            disabled={isRunning}
            aria-expanded={state.isReferenceOpen}
          >
            {state.isReferenceOpen ? "Hide commands" : "Miller commands"}
          </button>
        </div>
        <select
          className="rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
          value={state.selectedPresetId}
          onChange={(event) => handlePresetChange(event.target.value)}
          disabled={runDisabled}
          aria-label="Example preset"
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
          disabled={runDisabled}
          onInputChange={(value) =>
            dispatch({ type: "updateInput", payload: value })
          }
          onInputFormatChange={(format) =>
            dispatch({ type: "updateInputFormat", payload: format })
          }
          onLoadExample={() => dispatch({ type: "loadExampleDataset" })}
          onClear={() => dispatch({ type: "updateInput", payload: "" })}
        />

        <CommandBar
          command={state.command}
          outputFormat={state.outputFormat}
          commandInputRef={commandInputRef}
          disabled={runDisabled}
          isRunning={isRunning}
          autoRun={autoRun}
          onAutoRunChange={handleAutoRunChange}
          onCommandChange={(value) =>
            dispatch({ type: "updateCommand", payload: value })
          }
          onCommandKeyDown={handleCommandKeyDown}
          onCaptureCommandSelection={captureCommandSelection}
          onOutputFormatChange={(format) =>
            dispatch({ type: "updateOutputFormat", payload: format })
          }
          onRun={() => void handleRun()}
          onCancel={() => {
            activeRequestControllerRef.current?.abort();
            activeRequestControllerRef.current = null;
            dispatch({ type: "cancelRun" });
          }}
        />

        {state.isReferenceOpen ? (
          <OperationsReference
            disabled={runDisabled}
            isOpen={state.isReferenceOpen}
            onToggle={() => dispatch({ type: "toggleReference" })}
            onInsertOperation={handleOperationInsert}
          />
        ) : null}

        <OutputPanel
          output={state.execution.output}
          error={state.execution.errorMessage}
          executionStatus={state.execution.status}
          outputFormat={state.outputFormat}
          runSummary={state.execution.runSummary}
          copyStatus={state.copyStatus}
          statusMessage={state.statusMessage}
          prettyPrint={prettyPrint}
          tableView={tableView}
          onPrettyPrintChange={setPrettyPrint}
          onTableViewChange={setTableView}
          onCopy={async () => {
            if (!state.execution.output) {
              return;
            }

            try {
              await navigator.clipboard.writeText(state.execution.output);
              dispatch({ type: "setCopyStatus", payload: "copied" });
            } catch {
              dispatch({ type: "setCopyStatus", payload: "failed" });
            }
          }}
          onDownload={() => {
            if (!state.execution.output) {
              return;
            }

            const format = getOutputFormatById(state.outputFormat);
            const blob = new Blob([state.execution.output], {
              type: format.mimeType,
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `output.${format.extension}`;
            anchor.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
          }}
          onClear={() => dispatch({ type: "clearOutput" })}
          onRunAgain={() => void handleRun()}
        />
      </div>
    </main>
  );
}
