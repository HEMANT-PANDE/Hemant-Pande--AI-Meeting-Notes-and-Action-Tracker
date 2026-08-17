import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { AIInsights, AIProvider, AIProviderError } from "./ai.types";
import { aiInsightsSchema } from "./schema";
import { withRetry } from "./withRetry";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const EXTRACTION_TOOL_NAME = "record_meeting_insights";

// Forcing tool-use (function calling) with a strict input_schema is far more
// reliable than asking the model to "return JSON" in prose — Claude fills
// the tool's arguments directly, so there's no free-text parsing/markdown
// fencing to strip. We still validate the result with Zod (schema.ts)
// before it's ever saved, since the model can still omit optional nuance.
const EXTRACTION_TOOL = {
  name: EXTRACTION_TOOL_NAME,
  description:
    "Record structured insights extracted from a meeting transcript.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "A concise (3-6 sentence) summary covering purpose, key discussion, outcomes, concerns, and next steps.",
      },
      keyDiscussionPoints: {
        type: "array",
        items: { type: "string" },
        description: "The main topics/points actually discussed.",
      },
      keyDecisions: {
        type: "array",
        items: { type: "string" },
        description:
          "Concrete decisions made in the meeting. Return an EMPTY array if no clear decision was made — never invent one.",
      },
      risks: {
        type: "array",
        items: { type: "string" },
        description: "Risks or concerns explicitly raised. Empty array if none.",
      },
      unansweredQuestions: {
        type: "array",
        items: { type: "string" },
        description: "Open questions left unresolved. Empty array if none.",
      },
      actionItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            owner: {
              type: "string",
              description:
                "Name of the person responsible, if the transcript states one. Use exactly 'Unassigned' otherwise.",
            },
            dueDate: {
              type: "string",
              description:
                "ISO date (YYYY-MM-DD) ONLY if a specific date/timeframe is mentioned and can be resolved. Use exactly 'Not specified' otherwise. Never guess a date.",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              description: "Infer urgency from language/context; default to MEDIUM if unclear.",
            },
          },
          required: ["description", "owner", "dueDate", "priority"],
        },
      },
    },
    required: [
      "summary",
      "keyDiscussionPoints",
      "keyDecisions",
      "risks",
      "unansweredQuestions",
      "actionItems",
    ],
  },
};

const SYSTEM_PROMPT = `You are an assistant that extracts structured, factual information from business meeting transcripts.
Rules:
- Only report what is actually supported by the transcript. Do not invent decisions, owners, or dates.
- If information is missing, use the defaults described in the tool schema ("Unassigned", "Not specified", empty arrays).
- Be concise and specific; avoid generic filler sentences.
- Always respond by calling the ${EXTRACTION_TOOL_NAME} tool exactly once.`;

interface AnthropicToolUseBlock {
  type: "tool_use";
  name: string;
  input: unknown;
}

interface AnthropicResponse {
  content: Array<AnthropicToolUseBlock | { type: string; [key: string]: unknown }>;
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async generateMeetingInsights(input: { title: string; transcript: string }): Promise<AIInsights> {
    const data = await withRetry(() => this.callAnthropic(input));
    const toolUse = data.content.find(
      (block): block is AnthropicToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      throw new AIProviderError("Anthropic response did not include the expected tool call");
    }

    const parsed = aiInsightsSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      logger.error("Anthropic tool output failed schema validation", {
        issues: parsed.error.flatten(),
      });
      throw new AIProviderError("Anthropic response did not match the expected structure");
    }

    return parsed.data;
  }

  private async callAnthropic(input: { title: string; transcript: string }): Promise<AnthropicResponse> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
        messages: [
          {
            role: "user",
            content: `Meeting title: ${input.title}\n\nTranscript:\n${input.transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error("Anthropic API request failed", {
        status: response.status,
        body: errorBody.slice(0, 500),
      });
      throw new AIProviderError(`Anthropic API returned ${response.status}`, response.status);
    }

    return (await response.json()) as AnthropicResponse;
  }
}
