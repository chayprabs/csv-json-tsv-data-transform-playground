const AUTO_RUN_STORAGE_KEY = "mill-auto-run";

export function readAutoRunPreference(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTO_RUN_STORAGE_KEY) === "1";
}

export function writeAutoRunPreference(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTO_RUN_STORAGE_KEY, enabled ? "1" : "0");
}
