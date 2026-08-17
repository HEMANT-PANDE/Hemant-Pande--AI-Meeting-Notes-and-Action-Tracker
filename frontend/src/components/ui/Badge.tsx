import { cn } from "@/lib/utils";
import type { AiStatus, ActionStatus, Priority } from "@/types";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-info/15 text-info",
  MEDIUM: "bg-warning/15 text-warning",
  HIGH: "bg-danger/15 text-danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" }[priority];
  return <Badge className={priorityStyles[priority]}>{label}</Badge>;
}

const statusStyles: Record<ActionStatus, string> = {
  OPEN: "bg-muted/20 text-muted",
  IN_PROGRESS: "bg-info/15 text-info",
  BLOCKED: "bg-danger/15 text-danger",
  COMPLETED: "bg-success/15 text-success",
};

export function StatusBadge({ status }: { status: ActionStatus }) {
  const label = { OPEN: "Open", IN_PROGRESS: "In Progress", BLOCKED: "Blocked", COMPLETED: "Completed" }[
    status
  ];
  return <Badge className={statusStyles[status]}>{label}</Badge>;
}

const aiStatusStyles: Record<AiStatus, string> = {
  PENDING: "bg-muted/20 text-muted",
  PROCESSING: "bg-info/15 text-info",
  COMPLETED: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
};

export function AiStatusBadge({ status }: { status: AiStatus }) {
  const label = { PENDING: "Pending", PROCESSING: "Processing…", COMPLETED: "AI Ready", FAILED: "AI Failed" }[
    status
  ];
  return <Badge className={aiStatusStyles[status]}>{label}</Badge>;
}
