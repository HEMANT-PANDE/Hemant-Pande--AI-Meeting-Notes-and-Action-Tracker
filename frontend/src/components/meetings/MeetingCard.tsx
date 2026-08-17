import Link from "next/link";
import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { AiStatusBadge } from "@/components/ui/Badge";
import { MEETING_TYPE_LABELS, type Meeting } from "@/types";
import { formatDate } from "@/lib/utils";

type MeetingListItem = Pick<
  Meeting,
  "id" | "title" | "date" | "type" | "participants" | "aiStatus"
> & { _count?: { actionItems: number } };

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground">{meeting.title}</h3>
            <AiStatusBadge status={meeting.aiStatus} />
          </div>
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {MEETING_TYPE_LABELS[meeting.type]}
          </span>
          <div className="mt-auto flex flex-col gap-1.5 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(meeting.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {meeting.participants.length > 0 ? meeting.participants.join(", ") : "No participants listed"}
            </span>
            {meeting._count !== undefined && (
              <span className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                {meeting._count.actionItems} action item{meeting._count.actionItems === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
