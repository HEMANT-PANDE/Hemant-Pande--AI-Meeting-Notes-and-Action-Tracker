import { ActionStatus, Prisma, Priority } from "@prisma/client";
import { prisma } from "../config/db";
import { NotFoundError } from "../utils/AppError";

interface ListParams {
  ownerId: string;
  search?: string;
  status?: string;
  priority?: string;
  owner?: string;
  overdueOnly?: boolean;
  dueBefore?: Date;
  dueAfter?: Date;
  meetingId?: string;
  page: number;
  limit: number;
}

// Action items belong to a meeting which belongs to a user, so every query
// scopes through meeting.ownerId — no action item ever leaks across users.
export async function listActionItems(params: ListParams) {
  const { ownerId, search, status, priority, owner, overdueOnly, dueBefore, dueAfter, meetingId, page, limit } =
    params;

  const where: Prisma.ActionItemWhereInput = {
    meeting: { ownerId },
    ...(meetingId ? { meetingId } : {}),
    ...(status ? { status: status as ActionStatus } : {}),
    ...(priority ? { priority: priority as Priority } : {}),
    ...(owner ? { owner: { contains: owner, mode: "insensitive" } } : {}),
    ...(search ? { description: { contains: search, mode: "insensitive" } } : {}),
    ...(overdueOnly
      ? { dueDate: { lt: new Date() }, status: { notIn: ["COMPLETED"] } }
      : {}),
    ...(dueBefore || dueAfter
      ? { dueDate: { ...(dueBefore ? { lte: dueBefore } : {}), ...(dueAfter ? { gte: dueAfter } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { meeting: { select: { id: true, title: true, date: true } } },
    }),
    prisma.actionItem.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function assertOwnership(actionItemId: string, ownerId: string) {
  const item = await prisma.actionItem.findFirst({
    where: { id: actionItemId, meeting: { ownerId } },
  });
  if (!item) throw new NotFoundError("Action item");
  return item;
}

async function assertMeetingOwnership(meetingId: string, ownerId: string) {
  const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, ownerId } });
  if (!meeting) throw new NotFoundError("Meeting");
  return meeting;
}

export async function createActionItem(
  ownerId: string,
  data: {
    meetingId: string;
    description: string;
    owner: string | null;
    dueDate: Date | null;
    priority: Priority;
    status: ActionStatus;
  }
) {
  await assertMeetingOwnership(data.meetingId, ownerId);
  return prisma.actionItem.create({ data: { ...data, source: "manual" } });
}

export async function updateActionItem(
  id: string,
  ownerId: string,
  data: Partial<{
    description: string;
    owner: string | null;
    dueDate: Date | null;
    priority: Priority;
    status: ActionStatus;
  }>
) {
  await assertOwnership(id, ownerId);
  return prisma.actionItem.update({ where: { id }, data });
}

export async function deleteActionItem(id: string, ownerId: string) {
  await assertOwnership(id, ownerId);
  await prisma.actionItem.delete({ where: { id } });
}
