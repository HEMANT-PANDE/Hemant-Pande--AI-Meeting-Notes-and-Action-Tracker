import { MeetingType, Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { NotFoundError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { aiProvider, AIProviderError } from "./ai";

interface ListParams {
  ownerId: string;
  search?: string;
  type?: string;
  page: number;
  limit: number;
}

export async function listMeetings(params: ListParams) {
  const { ownerId, search, type, page, limit } = params;

  const where: Prisma.MeetingWhereInput = {
    ownerId,
    ...(type ? { type: type as MeetingType } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { participants: { hasSome: [search] } },
          ],
        }
      : {}),
  };

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        date: true,
        type: true,
        participants: true,
        aiStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { actionItems: true } },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return { meetings, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getMeetingById(id: string, ownerId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: { id, ownerId },
    include: { actionItems: { orderBy: { createdAt: "desc" } } },
  });
  if (!meeting) throw new NotFoundError("Meeting");
  return meeting;
}

export async function createMeeting(
  ownerId: string,
  data: {
    title: string;
    date: Date;
    type: string;
    participants: string[];
    transcript: string;
    transcriptSource: string;
    notes?: string | null;
  }
) {
  const meeting = await prisma.meeting.create({
    data: {
      ...data,
      type: data.type as MeetingType,
      ownerId,
    },
  });

  // Fire-and-forget: don't make the user wait on the AI call to get a
  // meeting record. The frontend polls aiStatus on the detail page.
  void runAIGeneration(meeting.id).catch((err) =>
    logger.error("Background AI generation crashed", { meetingId: meeting.id, err })
  );

  return meeting;
}

export async function updateMeeting(
  id: string,
  ownerId: string,
  data: Partial<{
    title: string;
    date: Date;
    type: string;
    participants: string[];
    transcript: string;
    notes: string | null;
  }>
) {
  const existing = await prisma.meeting.findFirst({ where: { id, ownerId } });
  if (!existing) throw new NotFoundError("Meeting");

  const transcriptChanged = data.transcript !== undefined && data.transcript !== existing.transcript;

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      ...data,
      type: data.type as MeetingType | undefined,
      // If the transcript changed, previous AI output is stale — reset it
      // rather than silently showing insights for the old text.
      ...(transcriptChanged
        ? {
            aiStatus: "PENDING",
            summary: null,
            keyDiscussionPoints: Prisma.DbNull,
            keyDecisions: Prisma.DbNull,
            risks: Prisma.DbNull,
            unansweredQuestions: Prisma.DbNull,
            aiGeneratedAt: null,
            aiError: null,
          }
        : {}),
    },
  });

  if (transcriptChanged) {
    void runAIGeneration(meeting.id).catch((err) =>
      logger.error("Background AI generation crashed", { meetingId: meeting.id, err })
    );
  }

  return meeting;
}

export async function deleteMeeting(id: string, ownerId: string) {
  const existing = await prisma.meeting.findFirst({ where: { id, ownerId } });
  if (!existing) throw new NotFoundError("Meeting");
  await prisma.meeting.delete({ where: { id } });
}

// Re-run AI generation on demand (e.g. user clicks "Retry" after a failure).
// Fire-and-forget, same as createMeeting, so the request returns immediately
// and the frontend's existing poll-until-settled logic picks up progress.
export async function regenerateInsights(id: string, ownerId: string) {
  const existing = await prisma.meeting.findFirst({ where: { id, ownerId } });
  if (!existing) throw new NotFoundError("Meeting");

  const meeting = await prisma.meeting.update({
    where: { id },
    data: { aiStatus: "PENDING", aiError: null },
  });

  void runAIGeneration(id).catch((err) =>
    logger.error("Background AI regeneration crashed", { meetingId: id, err })
  );

  return meeting;
}

async function runAIGeneration(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) return;

  await prisma.meeting.update({ where: { id: meetingId }, data: { aiStatus: "PROCESSING" } });

  try {
    const insights = await aiProvider.generateMeetingInsights({
      title: meeting.title,
      transcript: meeting.transcript,
    });

    await prisma.$transaction([
      prisma.meeting.update({
        where: { id: meetingId },
        data: {
          summary: insights.summary,
          keyDiscussionPoints: insights.keyDiscussionPoints,
          keyDecisions: insights.keyDecisions,
          risks: insights.risks,
          unansweredQuestions: insights.unansweredQuestions,
          aiStatus: "COMPLETED",
          aiGeneratedAt: new Date(),
          aiError: null,
        },
      }),
      // Replace previously AI-extracted items rather than stacking duplicates
      // on every (re)generation. Manually-added items (source="manual") are
      // never touched.
      prisma.actionItem.deleteMany({ where: { meetingId, source: "ai" } }),
      prisma.actionItem.createMany({
        data: insights.actionItems.map((item) => ({
          meetingId,
          description: item.description,
          owner: item.owner === "Unassigned" ? null : item.owner,
          dueDate: item.dueDate === "Not specified" ? null : safeParseDate(item.dueDate),
          priority: item.priority,
          status: "OPEN",
          source: "ai",
        })),
      }),
    ]);

    logger.info("AI generation completed", { meetingId, provider: aiProvider.name });
  } catch (err) {
    const message =
      err instanceof AIProviderError ? err.message : "AI processing failed unexpectedly";
    logger.error("AI generation failed", { meetingId, error: message });
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { aiStatus: "FAILED", aiError: message },
    });
  }
}

function safeParseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
