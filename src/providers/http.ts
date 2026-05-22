import { ProviderError } from "./Provider";

export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Wraps `fetch` with an abort-based timeout. On timeout, throws a
 * `ProviderError` with a clear message instead of leaving the request hanging.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new ProviderError(
        `Request timed out after ${timeoutMs}ms — the provider did not respond in time.`,
        err,
      );
    }
    throw err;
  }
}
