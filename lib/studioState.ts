import type { DataFormatId } from "@/lib/formats";
import {
  DEFAULT_EXAMPLE_PRESET,
  EXAMPLE_PRESETS,
  SAMPLE_DATASET,
  type ExamplePreset,
} from "@/lib/presets";
import type { SharedStudioState } from "@/lib/shareState";

export const CUSTOM_PRESET_ID = "custom";

export interface RunSummary {
  inputRows: number;
  outputRows: number;
  durationMs: number;
}

export type ExecutionStatus = "idle" | "running" | "success" | "error";
export type CopyStatus = "idle" | "copied" | "failed";

interface ExecutionState {
  status: ExecutionStatus;
  output: string;
  errorMessage: string | null;
  runSummary: RunSummary | null;
}

interface HistoryState {
  items: string[];
  index: number | null;
  draft: string;
}

export interface StudioState {
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: DataFormatId;
  selectedPresetId: string;
  isReferenceOpen: boolean;
  execution: ExecutionState;
  history: HistoryState;
  copyStatus: CopyStatus;
  statusMessage: string;
}

type StudioAction =
  | { type: "hydrateSharedState"; payload: SharedStudioState }
  | { type: "applyPreset"; payload: ExamplePreset }
  | { type: "selectCustomWorkspace" }
  | { type: "loadExampleDataset" }
  | { type: "updateInput"; payload: string }
  | { type: "updateCommand"; payload: string }
  | { type: "updateInputFormat"; payload: DataFormatId }
  | { type: "updateOutputFormat"; payload: DataFormatId }
  | { type: "insertOperation"; payload: string }
  | { type: "toggleReference" }
  | { type: "startRun" }
  | {
      type: "runSuccess";
      payload: {
        output: string;
        runSummary: RunSummary;
      };
    }
  | {
      type: "runFailure";
      payload: {
        errorMessage: string;
      };
    }
  | { type: "setCopyStatus"; payload: CopyStatus }
  | { type: "resetCopyStatus" }
  | { type: "recordCommandHistory"; payload: string }
  | { type: "historyUp" }
  | { type: "historyDown" };

function createIdleExecutionState(): ExecutionState {
  return {
    status: "idle",
    output: "",
    errorMessage: null,
    runSummary: null,
  };
}

function createInitialHistoryState(): HistoryState {
  return {
    items: [],
    index: null,
    draft: "",
  };
}

function resetExecutionState(state: StudioState): StudioState {
  return {
    ...state,
    execution: createIdleExecutionState(),
    copyStatus: "idle",
    statusMessage: "",
  };
}

function resetHistoryNavigation(history: HistoryState): HistoryState {
  return {
    ...history,
    index: null,
    draft: "",
  };
}

function markWorkspaceDirty(
  state: StudioState,
  overrides: Partial<
    Pick<StudioState, "input" | "command" | "inputFormat" | "outputFormat">
  >,
  options?: {
    resetHistoryNavigation?: boolean;
  },
): StudioState {
  const history = options?.resetHistoryNavigation
    ? resetHistoryNavigation(state.history)
    : state.history;

  return {
    ...resetExecutionState(state),
    ...overrides,
    selectedPresetId: CUSTOM_PRESET_ID,
    history,
  };
}

function recordCommandHistory(
  historyItems: string[],
  command: string,
): string[] {
  const trimmedCommand = command.trim();

  if (!trimmedCommand) {
    return historyItems;
  }

  return [
    trimmedCommand,
    ...historyItems.filter((historyItem) => historyItem !== trimmedCommand),
  ].slice(0, 20);
}

function getMatchingPresetId(sharedState: SharedStudioState) {
  return (
    EXAMPLE_PRESETS.find(
      (preset) =>
        preset.input === sharedState.input &&
        preset.command === sharedState.command &&
        preset.inputFormat === sharedState.inputFormat &&
        preset.outputFormat === sharedState.outputFormat,
    )?.id ?? CUSTOM_PRESET_ID
  );
}

export function createInitialStudioState(
  initialSharedState?: SharedStudioState | null,
): StudioState {
  if (initialSharedState) {
    return {
      input: initialSharedState.input,
      command: initialSharedState.command,
      inputFormat: initialSharedState.inputFormat,
      outputFormat: initialSharedState.outputFormat,
      selectedPresetId: getMatchingPresetId(initialSharedState),
      isReferenceOpen: false,
      execution: createIdleExecutionState(),
      history: createInitialHistoryState(),
      copyStatus: "idle",
      statusMessage: "",
    };
  }

  return {
    input: DEFAULT_EXAMPLE_PRESET.input,
    command: DEFAULT_EXAMPLE_PRESET.command,
    inputFormat: DEFAULT_EXAMPLE_PRESET.inputFormat,
    outputFormat: DEFAULT_EXAMPLE_PRESET.outputFormat,
    selectedPresetId: DEFAULT_EXAMPLE_PRESET.id,
    isReferenceOpen: false,
    execution: createIdleExecutionState(),
    history: createInitialHistoryState(),
    copyStatus: "idle",
    statusMessage: "",
  };
}

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case "hydrateSharedState":
      return {
        ...state,
        ...action.payload,
        selectedPresetId: getMatchingPresetId(action.payload),
        execution: createIdleExecutionState(),
        history: resetHistoryNavigation(state.history),
        copyStatus: "idle",
        statusMessage: "",
      };

    case "applyPreset":
      return {
        ...state,
        input: action.payload.input,
        command: action.payload.command,
        inputFormat: action.payload.inputFormat,
        outputFormat: action.payload.outputFormat,
        selectedPresetId: action.payload.id,
        execution: createIdleExecutionState(),
        history: resetHistoryNavigation(state.history),
        copyStatus: "idle",
        statusMessage: `Loaded preset "${action.payload.label}".`,
      };

    case "selectCustomWorkspace":
      return {
        ...state,
        selectedPresetId: CUSTOM_PRESET_ID,
        statusMessage: "Editing a custom workspace.",
      };

    case "loadExampleDataset":
      return {
        ...markWorkspaceDirty(
          state,
          {
            input: SAMPLE_DATASET,
            inputFormat: "csv",
          },
          { resetHistoryNavigation: true },
        ),
        statusMessage: "Loaded the sample dataset.",
      };

    case "updateInput":
      return markWorkspaceDirty(
        state,
        { input: action.payload },
        { resetHistoryNavigation: false },
      );

    case "updateCommand":
      return markWorkspaceDirty(
        state,
        { command: action.payload },
        { resetHistoryNavigation: true },
      );

    case "updateInputFormat":
      return markWorkspaceDirty(
        state,
        { inputFormat: action.payload },
        { resetHistoryNavigation: false },
      );

    case "updateOutputFormat":
      return markWorkspaceDirty(
        state,
        { outputFormat: action.payload },
        { resetHistoryNavigation: false },
      );

    case "insertOperation": {
      const trimmedCommand = state.command.trim();
      const separator = trimmedCommand.endsWith("then") ? " " : " then ";
      const nextCommand = trimmedCommand
        ? `${trimmedCommand}${separator}${action.payload}`
        : action.payload;

      return {
        ...markWorkspaceDirty(
          state,
          { command: nextCommand },
          { resetHistoryNavigation: true },
        ),
        statusMessage: "Inserted operation starter syntax.",
      };
    }

    case "toggleReference":
      return {
        ...state,
        isReferenceOpen: !state.isReferenceOpen,
      };

    case "startRun":
      return {
        ...state,
        execution: {
          ...createIdleExecutionState(),
          status: "running",
        },
        copyStatus: "idle",
        statusMessage: "Running transformation.",
      };

    case "runSuccess":
      return {
        ...state,
        execution: {
          status: "success",
          output: action.payload.output,
          errorMessage: null,
          runSummary: action.payload.runSummary,
        },
        copyStatus: "idle",
        statusMessage:
          action.payload.runSummary.outputRows === 0
            ? "Transformation returned 0 rows."
            : `Completed in ${action.payload.runSummary.durationMs}ms.`,
      };

    case "runFailure":
      return {
        ...state,
        execution: {
          ...createIdleExecutionState(),
          status: "error",
          errorMessage: action.payload.errorMessage,
        },
        copyStatus: "idle",
        statusMessage: "Transformation failed.",
      };

    case "setCopyStatus":
      return {
        ...state,
        copyStatus: action.payload,
        statusMessage:
          action.payload === "copied"
            ? "Copied output to the clipboard."
            : action.payload === "failed"
              ? "Copy failed."
              : state.statusMessage,
      };

    case "resetCopyStatus":
      return {
        ...state,
        copyStatus: "idle",
      };

    case "recordCommandHistory":
      return {
        ...state,
        history: {
          items: recordCommandHistory(state.history.items, action.payload),
          index: null,
          draft: "",
        },
      };

    case "historyUp": {
      if (state.history.items.length === 0) {
        return state;
      }

      if (state.history.index === null) {
        const [firstCommand] = state.history.items;

        if (!firstCommand) {
          return state;
        }

        return {
          ...state,
          command: firstCommand,
          history: {
            ...state.history,
            index: 0,
            draft: state.command,
          },
        };
      }

      const nextIndex = Math.min(
        state.history.index + 1,
        state.history.items.length - 1,
      );
      const nextCommand = state.history.items[nextIndex];

      if (!nextCommand) {
        return state;
      }

      return {
        ...state,
        command: nextCommand,
        history: {
          ...state.history,
          index: nextIndex,
        },
      };
    }

    case "historyDown": {
      if (state.history.index === null) {
        return state;
      }

      if (state.history.index === 0) {
        return {
          ...state,
          command: state.history.draft,
          history: {
            ...state.history,
            index: null,
            draft: "",
          },
        };
      }

      const nextIndex = state.history.index - 1;
      const nextCommand = state.history.items[nextIndex];

      if (!nextCommand) {
        return state;
      }

      return {
        ...state,
        command: nextCommand,
        history: {
          ...state.history,
          index: nextIndex,
        },
      };
    }

    default:
      return state;
  }
}
