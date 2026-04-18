// Global AI concurrency lock.
//
// Why: Running multiple heavy AI calls (image scan + voice transcribe) at
// the same time on Android causes the WebView to OOM/crash (white screen).
// Each AI call uploads a base64 image/audio (often 500KB–2MB) and decodes a
// large response — doing 2–3 in parallel exceeds the WebView memory budget.
//
// Rule: Only ONE AI call may run at a time across the whole app. Additional
// callers get a friendly "busy" rejection so they can retry — never crash.

let inFlight = 0;
const MAX_CONCURRENT = 1;

export const isAiBusy = () => inFlight >= MAX_CONCURRENT;

/**
 * Acquire the AI lock. Returns a release function, or `null` if another AI
 * call is already in progress (caller should show a "busy" toast).
 */
export const acquireAiLock = (): (() => void) | null => {
  if (inFlight >= MAX_CONCURRENT) return null;
  inFlight++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inFlight = Math.max(0, inFlight - 1);
  };
};

export const getAiBusyMessage = () =>
  'Another AI task is still running. Please wait a moment and try again.';
