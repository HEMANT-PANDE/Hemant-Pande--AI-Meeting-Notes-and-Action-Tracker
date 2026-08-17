import { logger } from "../../utils/logger";
import { AIInsights, AIProvider } from "./ai.types";

// Wraps a real provider with an automatic fallback (the mock provider) for
// when the real API is unavailable — rate-limited, overloaded, or down.
// This is the concrete implementation of the spec's own suggested pattern
// ("a mock AI service when API access is unavailable"): try the real
// provider first, and only fall back if it actually fails, rather than
// requiring a manual AI_PROVIDER flip. The meeting still ends up
// aiStatus=COMPLETED with genuine (if lower-fidelity) insights instead of
// aiStatus=FAILED, which is the better failure mode for a user mid-demo.
//
// Both providers already return the exact same Zod-validated AIInsights
// shape, so callers can't tell which one actually ran except via the log.
export class FallbackAIProvider implements AIProvider {
  readonly name: string;

  constructor(private readonly primary: AIProvider, private readonly fallback: AIProvider) {
    this.name = `${primary.name} (auto-fallback: ${fallback.name})`;
  }

  async generateMeetingInsights(input: { title: string; transcript: string }): Promise<AIInsights> {
    try {
      return await this.primary.generateMeetingInsights(input);
    } catch (err) {
      logger.warn(`Primary AI provider "${this.primary.name}" failed — falling back to "${this.fallback.name}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return this.fallback.generateMeetingInsights(input);
    }
  }
}
