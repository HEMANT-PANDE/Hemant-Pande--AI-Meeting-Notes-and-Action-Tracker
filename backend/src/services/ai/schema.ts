import { z } from "zod";

// Validates whatever the AI provider returns BEFORE it's persisted. If this
// fails, the meeting is marked aiStatus=FAILED with the reason — we never
// save malformed or partially-invented AI output.
export const aiActionItemDraftSchema = z.object({
  description: z.string().trim().min(1).max(500),
  owner: z.string().trim().min(1).max(100).default("Unassigned"),
  dueDate: z.string().trim().min(1).default("Not specified"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const aiInsightsSchema = z.object({
  summary: z.string().trim().min(1).max(5000),
  keyDiscussionPoints: z.array(z.string().trim().min(1)).max(30).default([]),
  keyDecisions: z.array(z.string().trim().min(1)).max(30).default([]),
  risks: z.array(z.string().trim().min(1)).max(30).default([]),
  unansweredQuestions: z.array(z.string().trim().min(1)).max(30).default([]),
  actionItems: z.array(aiActionItemDraftSchema).max(50).default([]),
});
