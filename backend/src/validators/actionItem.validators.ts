import { z } from "zod";

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const actionStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED"]);

const actionItemBody = z.object({
  meetingId: z.string().min(1),
  description: z.string().trim().min(2, "Description is required").max(500),
  owner: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  dueDate: z
    .union([z.coerce.date(), z.null()])
    .optional()
    .transform((v) => v ?? null),
  priority: priorityEnum.default("MEDIUM"),
  status: actionStatusEnum.default("OPEN"),
});

export const createActionItemSchema = z.object({
  body: actionItemBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateActionItemSchema = z.object({
  body: actionItemBody.partial().omit({ meetingId: true }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().min(1) }),
});

export const listActionItemsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().optional(),
    status: actionStatusEnum.optional(),
    priority: priorityEnum.optional(),
    owner: z.string().trim().optional(),
    overdueOnly: z.coerce.boolean().optional(),
    dueBefore: z.coerce.date().optional(),
    dueAfter: z.coerce.date().optional(),
    meetingId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
  params: z.object({}).optional(),
});
