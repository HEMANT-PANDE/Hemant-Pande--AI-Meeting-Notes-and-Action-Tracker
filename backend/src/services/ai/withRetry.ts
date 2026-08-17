import { logger } from "../../utils/logger";

// Both Gemini and Anthropic occasionally return 429 (rate limited) or 503
// (temporarily overloaded) — observed directly while building this against
// the real Gemini API. These are transient, not our bug, so a couple of
// short-backoff retries meaningfully improves reliability without masking
// genuine failures (permission/schema/4xx errors still throw immediately).
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
  return status === 429 || status === 503;
}
