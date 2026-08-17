// The one contract every AI provider must satisfy. The rest of the app
// (meeting.service.ts) only ever talks to this interface, so swapping
// Anthropic <-> mock <-> a future provider is a one-line change in
// services/ai/index.ts, never a change to business logic.
export interface AIActionItemDraft {
  description: string;
  owner: string; // "Unassigned" when the transcript doesn't name anyone
  dueDate: string; // ISO date (YYYY-MM-DD) or "Not specified"
  priority: "LOW" | "MEDIUM" | "HIGH";
}

export interface AIInsights {
  summary: string;
  keyDiscussionPoints: string[];
  keyDecisions: string[]; // empty array, never invented, when none were made
  risks: string[];
  unansweredQuestions: string[];
  actionItems: AIActionItemDraft[];
}

export interface AIProvider {
  /** Human-readable name, surfaced in logs/health checks. */
  readonly name: string;
  generateMeetingInsights(input: { title: string; transcript: string }): Promise<AIInsights>;
}

export class AIProviderError extends Error {
  /** HTTP status from the upstream provider, when applicable — lets withRetry() tell transient (429/503) from permanent failures. */
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "AIProviderError";
  }
}
