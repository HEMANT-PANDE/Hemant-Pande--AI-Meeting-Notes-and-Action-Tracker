import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AIProvider } from "./ai.types";
import { AnthropicProvider } from "./anthropic.provider";
import { FallbackAIProvider } from "./fallback.provider";
import { GeminiProvider } from "./gemini.provider";
import { MockAIProvider } from "./mock.provider";

// The single place that decides which provider implementation is active.
// Everything else in the app depends only on the AIProvider interface, so
// switching AI_PROVIDER in .env is the only change needed to swap providers.
//
// Real providers are always wrapped with an automatic mock fallback: if
// Gemini/Anthropic fails (rate limit, outage, transient error), the meeting
// still completes with mock-generated insights instead of surfacing
// aiStatus=FAILED. AI_PROVIDER=mock skips the wrapper since there's nothing
// to fall back from.
function createProvider(): AIProvider {
  if (env.AI_PROVIDER === "anthropic") return new FallbackAIProvider(new AnthropicProvider(), new MockAIProvider());
  if (env.AI_PROVIDER === "gemini") return new FallbackAIProvider(new GeminiProvider(), new MockAIProvider());
  return new MockAIProvider();
}

export const aiProvider: AIProvider = createProvider();
logger.info(`AI provider initialized: ${aiProvider.name}`);

export * from "./ai.types";
