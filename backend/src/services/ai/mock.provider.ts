import { AIActionItemDraft, AIInsights, AIProvider } from "./ai.types";
import { aiInsightsSchema } from "./schema";

// Rule-based fallback used when no ANTHROPIC_API_KEY is configured (or
// AI_PROVIDER=mock). It implements the exact same AIProvider interface as
// AnthropicProvider, so the rest of the app cannot tell them apart — this is
// the "demonstrate where a real provider would plug in" requirement from
// the spec, made concrete rather than just described.
//
// It only reports what it can actually find in the text (speaker lines,
// keyword-flagged sentences); it never fabricates an owner or a date.

const DECISION_KEYWORDS = ["decided", "agreed", "we will go with", "approved", "finalized", "concluded that"];
const RISK_KEYWORDS = ["risk", "concern", "blocker", "worried", "issue with", "problem with"];
const ACTION_KEYWORDS = ["will ", "needs to", "action item", "todo", "assigned to", "should ", "has to"];
const HIGH_PRIORITY_HINTS = ["urgent", "asap", "critical", "immediately", "high priority"];
const LOW_PRIORITY_HINTS = ["when possible", "low priority", "no rush", "eventually"];

const SPEAKER_LINE = /^\s*([A-Z][\w.'-]*(?:\s[A-Z][\w.'-]*)?)\s*:\s*(.+)$/;
const DATE_HINT = /\b(by\s+\w+\s?\d{0,2}|next\s+\w+|tomorrow|today|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\w+\s+\d{1,2}(?:st|nd|rd|th)?)\b/i;

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function extractSpeaker(sentence: string): { owner: string | null; content: string } {
  const match = sentence.match(SPEAKER_LINE);
  if (match) return { owner: match[1].trim(), content: match[2].trim() };
  return { owner: null, content: sentence };
}

function inferPriority(sentence: string): "LOW" | "MEDIUM" | "HIGH" {
  if (containsAny(sentence, HIGH_PRIORITY_HINTS)) return "HIGH";
  if (containsAny(sentence, LOW_PRIORITY_HINTS)) return "LOW";
  return "MEDIUM";
}

function extractDueDate(sentence: string): string {
  const match = sentence.match(DATE_HINT);
  return match ? match[0] : "Not specified";
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateMeetingInsights(input: { title: string; transcript: string }): Promise<AIInsights> {
    const sentences = splitSentences(input.transcript);

    const decisions = sentences.filter((s) => containsAny(s, DECISION_KEYWORDS)).slice(0, 8);
    const risks = sentences.filter((s) => containsAny(s, RISK_KEYWORDS)).slice(0, 8);
    const questions = sentences.filter((s) => s.trim().endsWith("?")).slice(0, 8);

    const discussionPoints = sentences
      .filter((s) => !decisions.includes(s) && !risks.includes(s) && s.length > 25)
      .slice(0, 6);

    const actionItems: AIActionItemDraft[] = sentences
      .filter((s) => containsAny(s, ACTION_KEYWORDS))
      .slice(0, 10)
      .map((s) => {
        const { owner, content } = extractSpeaker(s);
        return {
          description: content.length > 300 ? content.slice(0, 300) + "…" : content,
          owner: owner ?? "Unassigned",
          dueDate: extractDueDate(s),
          priority: inferPriority(s),
        };
      });

    const summary =
      sentences.length > 0
        ? `Meeting "${input.title}" covered ${discussionPoints.length || sentences.length} main point(s). ` +
          sentences.slice(0, 3).join(" ")
        : `No transcript content was available to summarize for "${input.title}".`;

    const draft = {
      summary: summary.slice(0, 2000),
      keyDiscussionPoints: discussionPoints,
      keyDecisions: decisions,
      risks,
      unansweredQuestions: questions,
      actionItems,
    };

    // Route through the same Zod schema the real provider uses, so both
    // providers guarantee an identical, validated shape to the caller.
    return aiInsightsSchema.parse(draft);
  }
}
