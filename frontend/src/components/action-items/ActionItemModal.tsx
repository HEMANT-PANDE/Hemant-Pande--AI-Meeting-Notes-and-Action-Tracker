"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PRIORITY_LABELS, STATUS_LABELS, type ActionItem, type ActionStatus, type Priority } from "@/types";
import { toDateInputValue } from "@/lib/utils";

const baseSchema = z.object({
  description: z.string().trim().min(2, "Description is required").max(500),
  owner: z.string().trim().max(100).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED"]),
  meetingId: z.string().optional(),
});
type FormValues = z.infer<typeof baseSchema>;

export interface ActionItemSubmitValues {
  description: string;
  owner: string | null;
  dueDate: string | null;
  priority: Priority;
  status: ActionStatus;
  meetingId?: string;
}

interface ActionItemModalProps {
  open: boolean;
  item?: ActionItem | null;
  submitting?: boolean;
  /** When provided (e.g. from the global Action Tracker), a meeting picker is shown. */
  meetings?: { id: string; title: string }[];
  onClose: () => void;
  onSubmit: (values: ActionItemSubmitValues) => Promise<void>;
}

export function ActionItemModal({ open, item, submitting, meetings, onClose, onSubmit }: ActionItemModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = meetings
    ? baseSchema.extend({ meetingId: z.string().min(1, "Select a meeting") })
    : baseSchema;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        description: item?.description ?? "",
        owner: item?.owner ?? "",
        dueDate: toDateInputValue(item?.dueDate),
        priority: item?.priority ?? "MEDIUM",
        status: item?.status ?? "OPEN",
        meetingId: item?.meetingId ?? meetings?.[0]?.id ?? "",
      });
      setServerError(null);
    }
  }, [open, item, meetings, reset]);

  if (!open) return null;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit({
        description: values.description,
        owner: values.owner && values.owner.trim().length > 0 ? values.owner.trim() : null,
        dueDate: values.dueDate && values.dueDate.length > 0 ? values.dueDate : null,
        priority: values.priority,
        status: values.status,
        meetingId: values.meetingId,
      });
    } catch {
      setServerError("Could not save this action item. Please try again.");
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            {item ? "Edit Action Item" : "Add Action Item"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
          {meetings && !item && (
            <FormField label="Meeting" htmlFor="meetingId" error={errors.meetingId?.message}>
              <Select id="meetingId" {...register("meetingId")}>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={3} {...register("description")} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Owner" htmlFor="owner" hint="Leave blank for Unassigned">
              <Input id="owner" {...register("owner")} />
            </FormField>
            <FormField label="Due Date" htmlFor="dueDate" hint="Leave blank if not specified">
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </FormField>
            <FormField label="Priority" htmlFor="priority">
              <Select id="priority" {...register("priority")}>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status" htmlFor="status">
              <Select id="status" {...register("status")}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {serverError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              {item ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
