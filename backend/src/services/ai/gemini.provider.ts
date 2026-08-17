import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AIInsights, AIProvider, AIProviderError } from "./ai.types";
import { aiInsightsSchema } from "./schema";
import { withRetry } from "./withRetry";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Gemini's native structured-output mode: responseMimeType + responseSchema
// forces the model to return JSON conforming to this schema directly (no
// tool-call indirection needed, unlike Anthropic). We still validate with
// Zod (schema.ts) before persisting — the model can still omit nuance even
// when the shape is guaranteed.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    keyDiscussionPoints: { type: "ARRAY", items: { type: "STRING" } },
    keyDecisions: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    unansweredQuestions: { type: "ARRAY", items: { type: "STRING" } },
    actionItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          owner: { type: "STRING" },
          dueDate: { type: "STRING" },
          priority: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH"] },
        },
        required: ["description", "owner", "dueDate", "priority"],
      },
    },
  },
  required: ["summary", "keyDiscussionPoints", "keyDecisions", "risks", "unansweredQuestions", "actionItems"],
};

const SYSTEM_PROMPT = `You are an assistant that extracts structured, factual information from business meeting transcripts.
Rules:
- Only report what is actually supported by the transcript. Do not invent decisions, owners, or dates.
- If an action item's owner is not named in the transcript, set owner to exactly "Unassigned".
- If an action item's due date is not stated or cannot be resolved to a date, set dueDate to exactly "Not specified". Never guess a date.
- If no clear decision was made, return an empty keyDecisions array — never invent one.
- Be concise and specific; avoid generic filler sentences.
- Respond with JSON only, matching the provided response schema exactly.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async generateMeetingInsights(input: { title: string; transcript: string }): Promise<AIInsights> {
    const data = await withRetry(() => this.callGemini(input));

    if (data.promptFeedback?.blockReason) {
      throw new AIProviderError(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AIProviderError("Gemini response did not include any content");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      logger.error("Gemini response was not valid JSON", { snippet: text.slice(0, 500) });
      throw new AIProviderError("Gemini response was not valid JSON");
    }

    const parsed = aiInsightsSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error("Gemini output failed schema validation", { issues: parsed.error.flatten() });
      throw new AIProviderError("Gemini response did not match the expected structure");
    }

    return parsed.data;
  }

  private async callGemini(input: { title: string; transcript: string }): Promise<GeminiResponse> {
    const url = `${GEMINI_API_URL}/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `Meeting title: ${input.title}\n\nTranscript:\n${input.transcript}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error("Gemini API request failed", { status: response.status, body: errorBody.slice(0, 500) });

      if (response.status === 429) {
        // Surface something a user can actually act on, instead of a bare
        // "429" — free-tier quota errors include a "retry in Ns" hint.
        const retryMatch = errorBody.match(/retry in ([\d.]+)s/i);
        const waitHint = retryMatch ? ` Try again in about ${Math.ceil(Number(retryMatch[1]))}s.` : "";
        throw new AIProviderError(
          `Gemini rate limit reached (free-tier quota).${waitHint}`,
          response.status
        );
      }

      throw new AIProviderError(`Gemini API returned ${response.status}`, response.status);
    }

    return (await response.json()) as GeminiResponse;
  }
}
