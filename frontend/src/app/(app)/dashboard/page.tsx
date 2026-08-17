"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, ListTodo, TriangleAlert, Users } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiStatusBadge } from "@/components/ui/Badge";
import { MEETING_TYPE_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">An overview of your meetings and action items.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Meetings" value={data.totalMeetings} icon={Users} />
        <StatCard label="Total Action Items" value={data.totalActionItems} icon={ClipboardList} />
        <StatCard label="Open Action Items" value={data.openActionItems} icon={ListTodo} tone="warning" />
        <StatCard label="Completed" value={data.completedActionItems} icon={CheckCircle2} tone="success" />
        <StatCard label="Overdue" value={data.overdueActionItems} icon={TriangleAlert} tone="danger" />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Recently Created Meetings</h2>
          <Link href="/meetings" className="text-sm font-medium text-primary">
            View all
          </Link>
        </CardHeader>
        <CardBody>
          {data.recentMeetings.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No meetings yet"
              description="Create your first meeting to get started."
              action={
                <Link href="/meetings/new" className="text-sm font-medium text-primary">
                  Create a meeting →
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentMeetings.map((meeting) => (
                <li key={meeting.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/meetings/${meeting.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{meeting.title}</p>
                    <p className="text-xs text-muted">
                      {MEETING_TYPE_LABELS[meeting.type]} · {formatDate(meeting.date)}
                    </p>
                  </Link>
                  <AiStatusBadge status={meeting.aiStatus} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
