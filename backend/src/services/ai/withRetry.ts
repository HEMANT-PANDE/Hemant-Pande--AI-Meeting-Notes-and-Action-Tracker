import { logger } from "../../utils/logger";

// Only 503 (temporarily overloaded) is retried here — observed directly
// while building this against the real Gemini API, and confirmed transient
// (a plain retry seconds later succeeded). 429 (quota/rate limit) is
// deliberately NOT retried by default: Gemini's free tier returned a
// `Please retry in ~20-55s` hint, far longer than any short backoff budget
// this function could reasonably spend — retrying it quickly does nothing
// but burn more of an already-exhausted quota. Let it fail fast with a
// clear message instead (see gemini.provider.ts's 429 handling) so the
// user sees an accurate "rate limited, try again shortly" state rather
// than a slow, pointless retry loop.
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; isRetryable?: (err: unknown) => boolean } = {}
): Promise<T> {
  const { retries = 2, baseDelayMs = 1000, isRetryable = defaultIsRetryable } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryable(err)) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      logger.warn("AI request failed, retrying", { attempt: attempt + 1, delayMs: delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function defaultIsRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 503;
}
