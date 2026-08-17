"use client";

import { use, useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMeeting } from "@/hooks/useMeeting";
import { useActionItems } from "@/hooks/useActionItems";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { AIInsightsPanel } from "@/components/meetings/AIInsightsPanel";
import { ActionItemTable } from "@/components/action-items/ActionItemTable";
import { ActionItemModal, type ActionItemSubmitValues } from "@/components/action-items/ActionItemModal";
import { MEETING_TYPE_LABELS, type ActionItem, type ActionStatus, type Priority } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { meeting, loading, error, refetch, regenerate } = useMeeting(id);
  const actionItems = useActionItems({ meetingId: id, limit: 100 });

  const [deleteMeetingOpen, setDeleteMeetingOpen] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState(false);
  const [modalItem, setModalItem] = useState<ActionItem | "new" | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ActionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <Spinner label="Loading meeting…" />;
  if (error) return <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>;
  if (!meeting) return null;

  const handleDeleteMeeting = async () => {
    setDeletingMeeting(true);
    try {
      await api.delete(`/meetings/${meeting.id}`);
      router.push("/meetings");
    } catch (err) {
      setDeletingMeeting(false);
      setDeleteMeetingOpen(false);
      setActionError(err instanceof ApiError ? err.message : "Could not delete this meeting.");
    }
  };

  const handleQuickUpdate = async (itemId: string, patch: { status?: ActionStatus; priority?: Priority }) => {
    try {
      await api.put(`/action-items/${itemId}`, patch);
      actionItems.refetch();
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this action item.");
    }
  };

  const handleSaveItem = async (values: ActionItemSubmitValues) => {
    setSavingItem(true);
    try {
      if (modalItem && modalItem !== "new") {
        await api.put(`/action-items/${modalItem.id}`, values);
      } else {
        await api.post("/action-items", { ...values, meetingId: meeting.id });
      }
      setModalItem(null);
      actionItems.refetch();
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItem) return;
    setDeletingItem(true);
    try {
      await api.delete(`/action-items/${deleteItem.id}`);
      setDeleteItem(null);
      actionItems.refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not delete this action item.");
    } finally {
      setDeletingItem(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {MEETING_TYPE_LABELS[meeting.type]}
          </span>
          <h1 className="mt-2 text-xl font-semibold text-foreground">{meeting.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(meeting.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {meeting.participants.length > 0 ? meeting.participants.join(", ") : "No participants listed"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Created {formatDateTime(meeting.createdAt)} · Updated {formatDateTime(meeting.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href={`/meetings/${meeting.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setDeleteMeetingOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {actionError && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{actionError}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AIInsightsPanel meeting={meeting} onRegenerate={regenerate} />

        <Card>
          <CardHeader>
            <h2 className="font-medium text-foreground">Transcript</h2>
            <p className="text-xs text-muted">
              {meeting.transcriptSource === "uploaded" ? "Uploaded as a file" : "Pasted as text"}
            </p>
          </CardHeader>
          <CardBody>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-foreground">
              {meeting.transcript}
            </div>
          </CardBody>
        </Card>
      </div>

      {meeting.notes && (
        <Card>
          <CardHeader>
            <h2 className="font-medium text-foreground">Meeting Notes</h2>
          </CardHeader>
          <CardBody>
            <div className="tiptap-content text-sm" dangerouslySetInnerHTML={{ __html: meeting.notes }} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Action Items</h2>
          <Button size="sm" onClick={() => setModalItem("new")}>
            <Plus className="h-4 w-4" />
            Add Action Item
          </Button>
        </CardHeader>
        <CardBody>
          {actionItems.loading && <Spinner label="Loading action items…" />}
          {!actionItems.loading && (actionItems.data?.items.length ?? 0) === 0 && (
            <EmptyState
              title="No action items yet"
              description="Action items extracted from the transcript will appear here, or add one manually."
            />
          )}
          {!actionItems.loading && (actionItems.data?.items.length ?? 0) > 0 && (
            <ActionItemTable
              items={actionItems.data!.items}
              onQuickUpdate={handleQuickUpdate}
              onEdit={(item) => setModalItem(item)}
              onDelete={(item) => setDeleteItem(item)}
            />
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deleteMeetingOpen}
        title="Delete this meeting?"
        description="This will permanently delete the meeting, its transcript, AI insights, and all of its action items. This cannot be undone."
        loading={deletingMeeting}
        onConfirm={handleDeleteMeeting}
        onCancel={() => setDeleteMeetingOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteItem}
        title="Delete this action item?"
        description="This action item will be permanently removed."
        loading={deletingItem}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteItem(null)}
      />

      <ActionItemModal
        open={!!modalItem}
        item={modalItem && modalItem !== "new" ? modalItem : null}
        submitting={savingItem}
        onClose={() => setModalItem(null)}
        onSubmit={handleSaveItem}
      />
    </div>
  );
}
