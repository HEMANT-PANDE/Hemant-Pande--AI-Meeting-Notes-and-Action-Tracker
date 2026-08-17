"use client";

import Link from "next/link";
import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { PRIORITY_LABELS, STATUS_LABELS, type ActionItem, type ActionStatus, type Priority } from "@/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";

interface ActionItemTableProps {
  items: ActionItem[];
  showMeetingColumn?: boolean;
  onQuickUpdate: (id: string, patch: { status?: ActionStatus; priority?: Priority }) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
}

export function ActionItemTable({ items, showMeetingColumn, onQuickUpdate, onEdit, onDelete }: ActionItemTableProps) {
  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-border/20 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Task</th>
              {showMeetingColumn && <th className="px-4 py-3 font-medium">Meeting</th>}
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const overdue = isOverdue(item.dueDate, item.status);
              return (
                <tr key={item.id} className="align-top">
                  <td className="max-w-xs px-4 py-3">
                    <div className="flex items-start gap-1.5">
                      {item.source === "ai" && (
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-label="AI-extracted" />
                      )}
                      <span className="text-foreground">{item.description}</span>
                    </div>
                  </td>
                  {showMeetingColumn && (
                    <td className="px-4 py-3">
                      {item.meeting ? (
                        <Link href={`/meetings/${item.meeting.id}`} className="text-primary hover:underline">
                          {item.meeting.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted">{item.owner ?? "Unassigned"}</td>
                  <td className={cn("px-4 py-3", overdue ? "font-medium text-danger" : "text-muted")}>
                    {formatDate(item.dueDate)}
                    {overdue && " (Overdue)"}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      className="w-28 py-1"
                      value={item.priority}
                      onChange={(e) => onQuickUpdate(item.id, { priority: e.target.value as Priority })}
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      className="w-32 py-1"
                      value={item.status}
                      onChange={(e) => onQuickUpdate(item.id, { status: e.target.value as ActionStatus })}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-md p-1.5 text-muted hover:bg-border/50 hover:text-foreground"
                        aria-label="Edit action item"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label="Delete action item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item) => {
          const overdue = isOverdue(item.dueDate, item.status);
          return (
            <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-1.5">
                  {item.source === "ai" && <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
                  <p className="text-sm font-medium text-foreground">{item.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(item)} className="rounded-md p-1.5 text-muted hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(item)} className="rounded-md p-1.5 text-muted hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showMeetingColumn && item.meeting && (
                <Link href={`/meetings/${item.meeting.id}`} className="mt-1 block text-xs text-primary">
                  {item.meeting.title}
                </Link>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{item.owner ?? "Unassigned"}</span>
                <span>·</span>
                <span className={overdue ? "font-medium text-danger" : ""}>
                  {formatDate(item.dueDate)}
                  {overdue && " (Overdue)"}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <PriorityBadge priority={item.priority} />
                <StatusBadge status={item.status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Select
                  className="py-1 text-xs"
                  value={item.priority}
                  onChange={(e) => onQuickUpdate(item.id, { priority: e.target.value as Priority })}
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  className="py-1 text-xs"
                  value={item.status}
                  onChange={(e) => onQuickUpdate(item.id, { status: e.target.value as ActionStatus })}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
