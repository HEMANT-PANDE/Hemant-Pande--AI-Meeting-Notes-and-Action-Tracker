import { prisma } from "../config/db";

export async function getDashboardStats(ownerId: string) {
  const now = new Date();

  const [
    totalMeetings,
    totalActionItems,
    openActionItems,
    completedActionItems,
    overdueActionItems,
    recentMeetings,
  ] = await Promise.all([
    prisma.meeting.count({ where: { ownerId } }),
    prisma.actionItem.count({ where: { meeting: { ownerId } } }),
    prisma.actionItem.count({ where: { meeting: { ownerId }, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
    prisma.actionItem.count({ where: { meeting: { ownerId }, status: "COMPLETED" } }),
    prisma.actionItem.count({
      where: {
        meeting: { ownerId },
        status: { not: "COMPLETED" },
        dueDate: { lt: now },
      },
    }),
    prisma.meeting.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, date: true, type: true, aiStatus: true, createdAt: true },
    }),
  ]);

  return {
    totalMeetings,
    totalActionItems,
    openActionItems,
    completedActionItems,
    overdueActionItems,
    recentMeetings,
  };
}
