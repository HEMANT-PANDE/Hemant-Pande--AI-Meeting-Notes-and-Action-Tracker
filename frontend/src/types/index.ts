// Mirrors the backend's Prisma enums/shapes. Kept as a single hand-written
// source of truth on the frontend since the two apps don't share a package
// in this setup — see README "Future improvements" for a shared-types note.

export type MeetingType =
  | "CLIENT_MEETING"
  | "SALES_MEETING"
  | "PROJECT_MEETING"
  | "INTERNAL_MEETING"
  | "REQUIREMENT_DISCUSSION"
  | "RETROSPECTIVE"
  | "OTHER";

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  CLIENT_MEETING: "Client Meeting",
  SALES_MEETING: "Sales Meeting",
  PROJECT_MEETING: "Project Meeting",
  INTERNAL_MEETING: "Internal Meeting",
  REQUIREMENT_DISCUSSION: "Requirement Discussion",
  RETROSPECTIVE: "Retrospective",
  OTHER: "Other",
};

export type AiStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type ActionStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_LABELS: Record<ActionStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  description: string;
  owner: string | null;
  dueDate: string | null;
  priority: Priority;
  status: ActionStatus;
  source: "ai" | "manual";
  createdAt: string;
  updatedAt: string;
  meeting?: { id: string; title: string; date: string };
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  type: MeetingType;
  participants: string[];
  transcript: string;
  transcriptSource: "pasted" | "uploaded";
  notes: string | null;
  summary: string | null;
  keyDiscussionPoints: string[] | null;
  keyDecisions: string[] | null;
  risks: string[] | null;
  unansweredQuestions: string[] | null;
  aiStatus: AiStatus;
  aiError: string | null;
  aiGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actionItems?: ActionItem[];
  _count?: { actionItems: number };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalMeetings: number;
  totalActionItems: number;
  openActionItems: number;
  completedActionItems: number;
  overdueActionItems: number;
  recentMeetings: Pick<Meeting, "id" | "title" | "date" | "type" | "aiStatus" | "createdAt">[];
}
