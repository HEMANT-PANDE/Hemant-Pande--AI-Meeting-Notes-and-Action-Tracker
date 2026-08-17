import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AIProvider } from "./ai.types";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { MockAIProvider } from "./mock.provider";

// The single place that decides which provider implementation is active.
// Everything else in the app depends only on the AIProvider interface, so
// switching AI_PROVIDER in .env is the only change needed to swap providers.
function createProvider(): AIProvider {
  if (env.AI_PROVIDER === "anthropic") return new AnthropicProvider();
  if (env.AI_PROVIDER === "gemini") return new GeminiProvider();
  return new MockAIProvider();
}

export const aiProvider: AIProvider = createProvider();
logger.info(`AI provider initialized: ${aiProvider.name}`);

export * from "./ai.types";
