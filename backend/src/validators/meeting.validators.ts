import { z } from "zod";

export const meetingTypeEnum = z.enum([
  "CLIENT_MEETING",
  "SALES_MEETING",
  "PROJECT_MEETING",
  "INTERNAL_MEETING",
  "REQUIREMENT_DISCUSSION",
  "RETROSPECTIVE",
  "OTHER",
]);

const MAX_TRANSCRIPT_LENGTH = 200_000; // ~200k chars, generous for a text transcript

const meetingBody = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  date: z.coerce.date({ errorMap: () => ({ message: "Enter a valid meeting date" }) }),
  type: meetingTypeEnum.default("OTHER"),
  participants: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((arr) => arr.filter(Boolean)),
  transcript: z
    .string()
    .trim()
    .min(1, "Transcript cannot be empty")
    .max(MAX_TRANSCRIPT_LENGTH, "Transcript is too long"),
  transcriptSource: z.enum(["pasted", "uploaded"]).default("pasted"),
  notes: z.string().max(20_000, "Notes are too long").optional().nullable(),
});

export const createMeetingSchema = z.object({
  body: meetingBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateMeetingSchema = z.object({
  body: meetingBody.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const meetingIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const listMeetingsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().optional(),
    type: meetingTypeEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
  params: z.object({}).optional(),
});
